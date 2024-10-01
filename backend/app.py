from openai import OpenAI
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS  # Import CORS correctly
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timedelta
from database import get_database
from models.user import User
import os
import csv
import io

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MONGO_URI = os.getenv('MONGO_URI')

# Initialize extensions
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

db = get_database()


def serialize_object_id(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError(
        f"Object of type {obj.__class__.__name__} is not JSON serializable")


@app.route('/', methods=['GET'])
def check():
    return "hello world"


# Get user profile
@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = db.users.find_one({'_id': ObjectId(current_user_id)})
    if user:
        user['_id'] = str(user['_id'])
        del user['password']
        return jsonify(user), 200
    return jsonify({'message': 'User not found'}), 404


# User Register
@app.route('/auth/register', methods=['POST'])
def new_register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if User.get_user_by_email(email):
        return jsonify({"msg": "Email already exists"}), 400

    user = User.create_user(name, email, password)
    return jsonify({"msg": "User created successfully"}), 201


# User Login
@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.get_user_by_email(email)
    if user and user.check_password(password):
        # Create an access token with both name and email as claims
        additional_claims = {"name": user.name, "email": email}
        access_token = create_access_token(
            identity=email, additional_claims=additional_claims)
        return jsonify(access_token=access_token), 200
    return jsonify({"msg": "Invalid Email or password"}), 401


@app.route('/api/transactions', methods=['POST'])
@jwt_required()
def create_transaction():
    current_user_id = get_jwt_identity()
    transactions = db.transactions
    users = db.users

    amount = float(request.json.get('amount'))
    cate = request.json.get('category')

    if not cate == 'income':
        amount = -abs(amount)

    new_transaction = {
        'userId': current_user_id,
        'description': request.json.get('description'),
        'amount': amount,
        'category': cate,
        'date': datetime.strptime(request.json.get('date'), '%Y-%m-%d'),
        'type': 'income' if cate == 'income' else 'expanse',  # 'income' or 'expense'
        'createdAt': datetime.now()
    }

    result = transactions.insert_one(new_transaction)
    new_transaction['_id'] = str(result.inserted_id)

    # Update user's total balance
    users.update_one(
        {'email': current_user_id},
        {'$inc': {'totalBalance': amount}})

    return jsonify(new_transaction), 201


@app.route('/api/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    current_user_id = get_jwt_identity()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = {'userId': current_user_id}
    if start_date and end_date:
        query['date'] = {
            '$gte': datetime.strptime(start_date, '%Y -%m-%d'),
            '$lte': datetime.strptime(end_date, '%Y - %m-%d')
        }

    transactions = list(db.transactions.find(query).sort('date', -1))
    transactions = sorted(
        transactions, key=lambda x: x['createdAt'], reverse=True)
    transactions = sorted(
        transactions, key=lambda x: x['date'], reverse=True)

    for transaction in transactions:
        transaction['_id'] = str(transaction['_id'])
        transaction['userId'] = str(transaction['userId'])
        transaction['date'] = transaction['date'].isoformat()
        transaction['time'] = transaction['createdAt'].isoformat()
    print('transactions: ', transactions)
    return jsonify([
        {**transaction, '_id': str(transaction['_id']), 'userId': str(
            transaction['userId']), 'accountId': ""}
        for transaction in transactions
    ]), 200


# Export Transaction for Specified Range
@app.route('/api/transactions/export', methods=['GET'])
@jwt_required()
def export_transactions():
    current_user_id = get_jwt_identity()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = {'userId': current_user_id}
    if start_date and end_date:
        query['date'] = {
            '$gte': datetime.strptime(start_date, '%Y-%m-%d'),
            '$lte': datetime.strptime(end_date, '%Y-%m-%d')
        }

    transactions = list(db.transactions.find(query).sort('date', -1))

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(['Date', 'Description', 'Category', 'Amount', 'Type'])
    for transaction in transactions:
        writer.writerow([
            transaction['date'].strftime('%Y-%m-%d'),
            transaction['description'],
            transaction['category'],
            abs(int(transaction['amount'])),
            'Income' if int(transaction['amount']) > 0 else 'Expense'
        ])

    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name='transactions.csv'
    )


@app.route('/api/budgets', methods=['POST'])
@jwt_required()
def create_budget():
    current_user_id = get_jwt_identity()
    budgets = db.budgets

    new_budget = {
        'userId': current_user_id,
        'category': request.json.get('category'),
        'amount': request.json.get('amount'),
        'period': request.json.get('period'),
        'createdAt': datetime.now(),
        'updatedAt': datetime.now()
    }

    # Check if a budget with the same category already exists
    existing_budget = budgets.find_one(
        {'userId': current_user_id, 'category': new_budget['category']})
    if existing_budget:
        return jsonify({'error': 'A budget for this category already exists'}), 400

    result = budgets.insert_one(new_budget)
    new_budget['_id'] = str(result.inserted_id)

    return jsonify(new_budget), 201


# Edit budget
@app.route('/api/budgets/<budget_id>', methods=['PUT'])
@jwt_required()
def update_budget(budget_id):
    current_user_id = get_jwt_identity()
    budgets = db.budgets

    update_data = {
        'amount': request.json.get('amount'),
        'period': request.json.get('period'),
        'updatedAt': datetime.now()
    }

    result = budgets.update_one(
        {'_id': ObjectId(budget_id), 'userId': current_user_id},
        {'$set': update_data}
    )

    if result.modified_count == 0:
        return jsonify({'error': 'Budget not found or you do not have permission to update it'}), 404

    updated_budget = budgets.find_one({'_id': ObjectId(budget_id)})
    updated_budget['_id'] = str(updated_budget['_id'])

    return jsonify(updated_budget), 200


# Delete budget
@app.route('/api/budgets/<budget_id>', methods=['DELETE'])
@jwt_required()
def delete_budget(budget_id):
    current_user_id = get_jwt_identity()
    budgets = db.budgets

    result = budgets.delete_one(
        {'_id': ObjectId(budget_id), 'userId': current_user_id})

    if result.deleted_count == 0:
        return jsonify({'error': 'Budget not found or you do not have permission to delete it'}), 404

    return jsonify({'message': 'Budget deleted successfully'}), 200


# Modified get_budgets route
@app.route('/api/budgets', methods=['GET'])
@jwt_required()
def get_budgets():
    current_user_id = get_jwt_identity()
    budgets = list(db.budgets.find({'userId': current_user_id}))

    for budget in budgets:
        budget['_id'] = str(budget['_id'])
        budget['userId'] = str(budget['userId'])
        budget['category'] = str(
            budget['category']) if 'category' in budget else str(budget['categoryId'])

        # Calculate spent amount
        start_of_period = get_start_of_period(budget['period'])
        transactions = db.transactions.find({
            'userId': current_user_id,
            'category': budget['category'],
            'date': {'$gte': start_of_period}
        })
        spent = sum(int(transaction['amount']) for transaction in transactions)
        budget['spent'] = spent

        # Check if budget is exceeded
        if spent > int(budget['amount']):
            create_notification(
                current_user_id, budget['category'], spent, budget['amount'])

    return jsonify(budgets), 200


# New route to get notifications
@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = get_jwt_identity()
    notifications = list(db.notifications.find(
        {'userId': current_user_id}).sort('createdAt', -1))

    for notification in notifications:
        notification['_id'] = str(notification['_id'])
        notification['userId'] = str(notification['userId'])

    return jsonify(notifications), 200


def create_notification(user_id, category, spent, limit):
    notification = {
        'userId': user_id,
        'category': category,
        'message': f"Budget limit exceeded for {category}. Spent: ${int(spent):.2f}, Limit: ${int(limit):.2f}",
        'createdAt': datetime.now(),
        'read': False
    }
    db.notifications.insert_one(notification)


def get_start_of_period(period):
    now = datetime.now()
    if period == 'daily':
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'weekly':
        return now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=now.weekday())
    elif period == 'monthly':
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'yearly':
        return now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        return now  # Default to current time if period is not recognized


# Create a new financial goal
@app.route('/api/goals', methods=['POST'])
@jwt_required()
def create_goal():
    current_user_id = get_jwt_identity()
    goals = db.goals

    new_goal = {
        'userId': current_user_id,
        'name': request.json.get('name'),
        'targetAmount': request.json.get('targetAmount'),
        'currentAmount': request.json.get('currentAmount', 0),
        'deadline': datetime.strptime(request.json.get('deadline'), '%Y-%m-%d'),
        'createdAt': datetime.now(),
        'updatedAt': datetime.now()
    }

    result = goals.insert_one(new_goal)
    new_goal['_id'] = str(result.inserted_id)

    return jsonify(new_goal), 201


# Get user's financial goals
@app.route('/api/goals', methods=['GET'])
@jwt_required()
def get_goals():
    current_user_id = get_jwt_identity()
    goals = db.goals.find({'userId': current_user_id})

    return jsonify([
        {**goal, '_id': str(goal['_id']), 'userId': str(goal['userId'])}
        for goal in goals
    ]), 200


# Update user settings
@app.route('/api/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    current_user_id = get_jwt_identity()
    settings = db.settings

    user_settings = settings.find_one({'userId': ObjectId(current_user_id)})
    if not user_settings:
        user_settings = {
            'userId': ObjectId(current_user_id),
            'createdAt': datetime.utcnow()
        }

    user_settings.update({
        'defaultCurrency': request.json.get('defaultCurrency'),
        'language': request.json.get('language'),
        'theme': request.json.get('theme'),
        'notificationPreferences': request.json.get('notificationPreferences'),
        'updatedAt': datetime.utcnow()
    })

    if '_id' in user_settings:
        settings.replace_one({'_id': user_settings['_id']}, user_settings)
    else:
        result = settings.insert_one(user_settings)
        user_settings['_id'] = result.inserted_id

    user_settings['_id'] = str(user_settings['_id'])
    user_settings['userId'] = str(user_settings['userId'])

    return jsonify(user_settings), 200


# Get user settings
@app.route('/api/settings', methods=['GET'])
@jwt_required()
def get_settings():
    current_user_id = get_jwt_identity()
    user_settings = db.settings.find_one(
        {'userId': ObjectId(current_user_id)})

    if user_settings:
        user_settings['_id'] = str(user_settings['_id'])
        user_settings['userId'] = str(user_settings['userId'])
        return jsonify(user_settings), 200

    return jsonify({'message': 'Settings not found'}), 404


# Get dashboard data
@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    token = get_jwt_identity()
    time_range = request.args.get('timeRange', 'month')

    # Calculate date range
    end_date = datetime.now()
    if time_range == 'week':
        start_date = end_date - timedelta(days=7)
    elif time_range == 'month':
        start_date = end_date - timedelta(days=30)
    elif time_range == 'quarter':
        start_date = end_date - timedelta(days=90)
    elif time_range == 'year':
        start_date = end_date - timedelta(days=365)
    else:
        return jsonify({'message': 'Invalid time range'}), 400

    # Get transactions within the date range
    transactions = db.transactions.find({
        'userId': token,
        'date': {'$gte': start_date, '$lte': end_date}
    })

    # Calculate total balance, income, and expenses
    total_balance = 0
    income = 0
    expenses = 0
    spending_by_category = {}

    for transaction in transactions:
        amount = int(transaction['amount'])
        if amount > 0:
            income += amount
        else:
            expenses += abs(amount)
            category = transaction['category']
            spending_by_category[category] = spending_by_category.get(
                category, 0) + abs(amount)

    # Get user's total balance
    user = db.users.find_one({'email': token})
    print('user: ', user)
    total_balance = user.get('totalBalance', 0)

    # Get previous period's balance for comparison
    previous_start_date = start_date - (end_date - start_date)
    previous_transactions = db.transactions.find({
        'userId': token,
        'date': {'$gte': previous_start_date, '$lt': start_date}
    })
    previous_balance = sum(t['amount'] for t in previous_transactions)
    balance_change = total_balance - previous_balance

    # Prepare income vs expenses data
    income_vs_expenses = [
        {'name': 'Income', 'value': income},
        {'name': 'Expenses', 'value': expenses}
    ]

    # Prepare spending by category data
    spending_by_category = [{'name': k, 'value': v}
                            for k, v in spending_by_category.items()]

    # Generate insights
    insights = []
    if balance_change > 0:
        insights.append({
            'type': 'info',
            'message': f'Your balance increased by ${balance_change:.2f} compared to the previous {time_range}.'
        })
    elif balance_change < 0:
        insights.append({
            'type': 'warning',
            'message': f'Your balance decreased by ${abs(balance_change):.2f} compared to the previous {time_range}.'
        })

    if expenses > income:
        insights.append({
            'type': 'warning',
            'message': f'Your expenses (${expenses:.2f}) exceeded your income (${income:.2f}) in this {time_range}.'
        })

    dashboard_data = {
        'totalBalance': total_balance,
        'balanceChange': balance_change,
        'income': income,
        'expenses': expenses,
        'incomeVsExpenses': income_vs_expenses,
        'spendingByCategory': spending_by_category,
        'insights': insights
    }

    return jsonify(dashboard_data), 200


@app.route('/api/analyze-transactions', methods=['GET'])
@jwt_required()
def analyze_transactions():
    current_user_id = get_jwt_identity()
    transactions = list(db.transactions.find(
        {'userId': current_user_id}).sort('date', -1).limit(50))

    transaction_text = "\n".join([
        f"Date: {t['date'].strftime('%Y-%m-%d')}, Description: {t['description']}, "
        f"Category: {t['category']}, Amount: ${abs(int(t['amount'])):.2f}, "
        f"Type: {'Income' if int(t['amount']) > 0 else 'Expense'}"
        for t in transactions
    ])

    prompt = f"Analyze the following transactions and provide useful insights, including identifying potentially useless transactions or suggesting alternatives:\n\n{transaction_text}"

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        analysis = response.choices[0].message.content
        return jsonify({"analysis": analysis}), 200
    except Exception as e:
        print('error: ', e)
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)

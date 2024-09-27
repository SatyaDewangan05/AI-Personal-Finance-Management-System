from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from flask import Blueprint, request, jsonify
from datetime import datetime
from database import get_database
from models.balance import Balance
db = get_database()

bp = Blueprint('data', __name__)


# Add income and balance data
@bp.route('/balance', methods=['POST'])
@jwt_required()
def add_balance():
    token = get_jwt()

    balance = Balance.create_balance(email=token.get('sub'), balance=request.json.get(
        'balance'), income=request.json.get('income'), expenses=request.json.get('expenses'))

    return jsonify({"id": str(balance.inserted_id)}), 201


# Get income and balance data
@bp.route('/balance', methods=['GET'])
@jwt_required()
def get_balance():
    token = get_jwt()
    balance = Balance.get_balance_by_email(token.get('sub'))
    return jsonify(balance), 201


# Create a new budget
@bp.route('/budgets', methods=['POST'])
@jwt_required()
def create_budget():
    current_user_id = get_jwt_identity()
    budgets = db.budgets

    new_budget = {
        'userId': ObjectId(current_user_id),
        'categoryId': ObjectId(request.json.get('categoryId')),
        'amount': request.json.get('amount'),
        'period': request.json.get('period'),
        'startDate': datetime.strptime(request.json.get('startDate'), '%Y-%m-%d'),
        'endDate': datetime.strptime(request.json.get('endDate'), '%Y-%m-%d'),
        'createdAt': datetime.now(),
        'updatedAt': datetime.now()
    }

    result = budgets.insert_one(new_budget)
    new_budget['_id'] = str(result.inserted_id)

    return jsonify(new_budget), 201


@bp.route('/transactions', methods=['POST'])
@jwt_required()
def add_transaction():
    current_user = get_jwt_identity()
    data = request.get_json()
    transaction = {
        'user': current_user,
        'amount': data['amount'],
        'category': data['category'],
        'date': data['date'],
        'description': data.get('description', '')
    }
    result = db.transactions.insert_one(transaction)
    return jsonify({"msg": "Transaction added", "id": str(result.inserted_id)}), 201


@bp.route('/transactions/<transaction_id>', methods=['PUT'])
@jwt_required()
def update_transaction(transaction_id):
    current_user = get_jwt_identity()
    data = request.get_json()
    result = db.transactions.update_one(
        {'_id': ObjectId(transaction_id), 'user': current_user},
        {'$set': data}
    )
    if result.modified_count:
        return jsonify({"msg": "Transaction updated"}), 200
    return jsonify({"msg": "Transaction not found or unauthorized"}), 404


@bp.route('/transactions/<transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    current_user = get_jwt_identity()
    result = db.transactions.delete_one(
        {'_id': ObjectId(transaction_id), 'user': current_user})
    if result.deleted_count:
        return jsonify({"msg": "Transaction deleted"}), 200
    return jsonify({"msg": "Transaction not found or unauthorized"}), 404


# if __name__ == "__main__":
#     # Get the database
#     db = get_database()
#     collection = db['users']
#     for item in collection.find():
#         print('item: ', item)

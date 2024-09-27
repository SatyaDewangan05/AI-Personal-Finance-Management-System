from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import Blueprint, request, jsonify
from database import get_database
db = get_database()

bp = Blueprint('transactions', __name__)


@bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    try:
        print('pinged')
        current_user = get_jwt_identity()
        transactions = list(db.transactions.find({'user': current_user}))
        for transaction in transactions:
            transaction['_id'] = str(transaction['_id'])
        return jsonify(transactions), 200
    except Exception as e:
        print('error: ', e)


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

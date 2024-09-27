from datetime import datetime
from database import get_database

db = get_database()


class Balance:
    def __init__(self, email, balance, income, expenses):
        self.email = email,
        self.balance = balance,
        self.income = income,
        self.expenses = expenses,

    @staticmethod
    def create_balance(email, balance, income, expenses):
        balance = db.balance.insert_one({
            'email': email,
            'balance': balance,
            'income': income,
            'expenses': expenses,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        })
        return balance

    @staticmethod
    def get_balance_by_email(email):
        user_data = db.balance.find_one({'email': email})
        print('user_data: ', user_data)
        if user_data:
            return {"income": user_data['income'], "expenses": user_data['expenses'], "balance": user_data['balance']}
        return None

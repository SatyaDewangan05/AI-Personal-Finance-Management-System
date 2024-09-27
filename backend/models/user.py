from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_database

db = get_database()


class User:
    def __init__(self, name, email, password):
        self.name = name
        self.email = email
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def create_user(name, email, password):
        user = User(name, email, password)
        db.users.insert_one({
            'name': user.name,
            'email': user.email,
            'password_hash': user.password_hash
        })
        return user

    @staticmethod
    def get_user_by_email(email):
        user_data = db.users.find_one({'email': email})
        if user_data:
            user = User(user_data['name'], user_data['email'], '')
            user.password_hash = user_data['password_hash']
            return user
        return None

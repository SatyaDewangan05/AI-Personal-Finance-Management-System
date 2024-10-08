import os


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    MONGO_URI = os.environ.get(
        'MONGO_URI') or 'mongodb://localhost:27017/finance_tracker'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'your-jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour

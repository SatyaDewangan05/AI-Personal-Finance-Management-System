# app.py

from routes import auth, transactions, data
from flask import Flask, jsonify
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from flask_cors import CORS  # Import CORS correctly
from config import Config

mongo = PyMongo()  # Create a PyMongo instance
jwt = JWTManager()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    mongo.init_app(app)  # Initialize PyMongo with the app
    jwt.init_app(app)    # Initialize JWTManager with the app
    CORS(app)            # Correctly initialize CORS with the app

    app.register_blueprint(auth.bp)
    app.register_blueprint(transactions.bp)
    app.register_blueprint(data.bp, url_prefix='/data')

    @app.route('/', methods=['GET'])
    def get_req():
        return "connected"

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=8500)

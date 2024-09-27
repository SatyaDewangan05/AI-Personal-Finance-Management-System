from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import User

bp = Blueprint('auth', __name__)


@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if User.get_user_by_email(email):
        return jsonify({"msg": "Email already exists"}), 400

    user = User.create_user(name, email, password)
    return jsonify({"msg": "User created successfully"}), 201


@bp.route('/login', methods=['POST'])
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


@bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

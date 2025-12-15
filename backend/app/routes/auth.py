from flask import Blueprint, request, jsonify, session
import uuid

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/user', methods=['GET'])
def get_user():
    user = session.get('user')
    if not user:
        return jsonify({'message': 'Not authenticated'}), 401
    return jsonify(user)

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password required'}), 400
    
    user = {
        'id': str(uuid.uuid4()),
        'email': email,
        'firstName': email.split('@')[0].title(),
        'lastName': '',
        'role': 'customer',
        'profileImageUrl': None
    }
    
    session['user'] = user
    return jsonify(user)

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('firstName', '')
    last_name = data.get('lastName', '')
    
    if not email or not password:
        return jsonify({'message': 'Email and password required'}), 400
    
    user = {
        'id': str(uuid.uuid4()),
        'email': email,
        'firstName': first_name or email.split('@')[0].title(),
        'lastName': last_name,
        'role': 'customer',
        'profileImageUrl': None
    }
    
    session['user'] = user
    return jsonify(user), 201

@bp.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({'message': 'Logged out successfully'})

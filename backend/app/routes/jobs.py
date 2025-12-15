from flask import Blueprint, request, jsonify, session
from functools import wraps
import uuid
from datetime import datetime

bp = Blueprint('jobs', __name__, url_prefix='/api')

jobs_store = {}
files_store = {}

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({'message': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/jobs', methods=['GET'])
@login_required
def get_jobs():
    user = session['user']
    user_jobs = [j for j in jobs_store.values() if j.get('customerId') == user['id']]
    return jsonify(user_jobs)

@bp.route('/jobs/<job_id>', methods=['GET'])
@login_required
def get_job(job_id):
    job = jobs_store.get(job_id)
    if not job:
        return jsonify({'message': 'Job not found'}), 404
    return jsonify(job)

@bp.route('/jobs', methods=['POST'])
@login_required
def create_job():
    user = session['user']
    data = request.get_json()
    
    job_id = str(uuid.uuid4())
    job = {
        'id': job_id,
        'customerId': user['id'],
        'serviceType': data.get('serviceType'),
        'turnaround': data.get('turnaround'),
        'status': 'draft',
        'title': data.get('title'),
        'instructions': data.get('instructions'),
        'wordCount': data.get('wordCount', 0),
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    }
    
    jobs_store[job_id] = job
    return jsonify(job), 201

@bp.route('/jobs/<job_id>', methods=['PATCH'])
@login_required
def update_job(job_id):
    job = jobs_store.get(job_id)
    if not job:
        return jsonify({'message': 'Job not found'}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if key in job:
            job[key] = value
    job['updatedAt'] = datetime.utcnow().isoformat()
    
    jobs_store[job_id] = job
    return jsonify(job)

@bp.route('/jobs/<job_id>/files', methods=['GET'])
@login_required
def get_job_files(job_id):
    job_files = [f for f in files_store.values() if f.get('jobId') == job_id]
    return jsonify(job_files)

@bp.route('/jobs/<job_id>/files', methods=['POST'])
@login_required
def create_job_file(job_id):
    data = request.get_json()
    
    file_id = str(uuid.uuid4())
    file_record = {
        'id': file_id,
        'jobId': job_id,
        'filename': data.get('filename'),
        'originalName': data.get('originalName'),
        'mimeType': data.get('mimeType'),
        'size': data.get('size'),
        'storagePath': data.get('storagePath'),
        'isOriginal': data.get('isOriginal', True),
        'virusScanStatus': 'pending',
        'uploadedAt': datetime.utcnow().isoformat()
    }
    
    files_store[file_id] = file_record
    return jsonify(file_record), 201

@bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    return jsonify([])

@bp.route('/notifications/<notification_id>/read', methods=['PATCH'])
@login_required
def mark_notification_read(notification_id):
    return jsonify({'success': True})

@bp.route('/orders', methods=['GET'])
@login_required
def get_orders():
    return jsonify([])

@bp.route('/orders', methods=['POST'])
@login_required
def create_order():
    user = session['user']
    data = request.get_json()
    
    order = {
        'id': str(uuid.uuid4()),
        'customerId': user['id'],
        'jobId': data.get('jobId'),
        'quoteId': data.get('quoteId'),
        'status': 'pending',
        'createdAt': datetime.utcnow().isoformat()
    }
    
    return jsonify(order), 201

@bp.route('/payments/mock', methods=['POST'])
@login_required
def mock_payment():
    data = request.get_json()
    
    payment = {
        'id': str(uuid.uuid4()),
        'orderId': data.get('orderId'),
        'gateway': 'mock',
        'gatewayTransactionId': f"MOCK-{int(datetime.utcnow().timestamp())}",
        'amount': data.get('amount'),
        'currency': data.get('currency', 'ZAR'),
        'status': 'completed',
        'paidAt': datetime.utcnow().isoformat()
    }
    
    return jsonify({'success': True, 'payment': payment})

@bp.route('/invoices/<order_id>', methods=['GET'])
@login_required
def get_invoice(order_id):
    return jsonify(None)

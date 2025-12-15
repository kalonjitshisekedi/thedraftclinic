from flask import Blueprint, request, jsonify, session
from functools import wraps

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = session.get('user')
        if not user or user.get('role') != 'admin':
            return jsonify({'message': 'Not authorized'}), 403
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    return jsonify({
        'totalJobs': 0,
        'activeJobs': 0,
        'completedJobs': 0,
        'totalRevenue': '0.00'
    })

@bp.route('/unassigned-jobs', methods=['GET'])
@admin_required
def get_unassigned_jobs():
    return jsonify([])

@bp.route('/reviewers', methods=['GET'])
@admin_required
def get_reviewers():
    return jsonify([])

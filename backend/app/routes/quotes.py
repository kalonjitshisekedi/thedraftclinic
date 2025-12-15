from flask import Blueprint, request, jsonify, session
from functools import wraps
import uuid
from datetime import datetime, timedelta

bp = Blueprint('quotes', __name__, url_prefix='/api')

quotes_store = {}

TURNAROUND_OPTIONS = {
    '24h': {'label': '24 Hours', 'description': 'Express delivery', 'multiplier': 2.0},
    '48h': {'label': '48 Hours', 'description': 'Fast turnaround', 'multiplier': 1.5},
    '72h': {'label': '72 Hours', 'description': 'Standard delivery', 'multiplier': 1.25},
    '1week': {'label': '1 Week', 'description': 'Economy option', 'multiplier': 1.0},
}

BASE_PRICES = {
    'proofreading': 0.08,
    'editing': 0.15,
    'formatting': 0.10,
}

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({'message': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/quotes/<job_id>', methods=['GET'])
@login_required
def get_quote(job_id):
    quote = quotes_store.get(job_id)
    return jsonify(quote)

@bp.route('/quotes', methods=['POST'])
@login_required
def create_quote():
    data = request.get_json()
    
    job_id = data.get('jobId')
    quote_id = str(uuid.uuid4())
    
    quote = {
        'id': quote_id,
        'jobId': job_id,
        'wordCount': data.get('wordCount'),
        'basePrice': str(data.get('basePrice')),
        'turnaroundMultiplier': str(data.get('turnaroundMultiplier', 1.0)),
        'subtotal': str(data.get('subtotal')),
        'vatAmount': str(data.get('vatAmount', 0)),
        'total': str(data.get('total')),
        'currency': data.get('currency', 'ZAR'),
        'exchangeRate': str(data.get('exchangeRate', 1.0)),
        'validUntil': (datetime.utcnow() + timedelta(days=1)).isoformat(),
        'createdAt': datetime.utcnow().isoformat()
    }
    
    quotes_store[job_id] = quote
    return jsonify(quote), 201

@bp.route('/quotes/calculate', methods=['POST'])
def calculate_quote():
    data = request.get_json()
    
    service_type = data.get('serviceType', 'proofreading')
    word_count = data.get('wordCount', 0)
    turnaround = data.get('turnaround', '1week')
    currency = data.get('currency', 'ZAR')
    
    price_per_word = BASE_PRICES.get(service_type, 0.10)
    turnaround_option = TURNAROUND_OPTIONS.get(turnaround, TURNAROUND_OPTIONS['1week'])
    multiplier = turnaround_option['multiplier']
    
    base_price = word_count * price_per_word
    subtotal = base_price * multiplier
    min_price = 50
    adjusted_subtotal = max(subtotal, min_price)
    vat_rate = 0.15
    vat_amount = adjusted_subtotal * vat_rate
    total = adjusted_subtotal + vat_amount
    
    exchange_rate = 1
    if currency != 'ZAR':
        rates = {'USD': 0.055, 'EUR': 0.050, 'GBP': 0.043}
        exchange_rate = rates.get(currency, 1)
    
    return jsonify({
        'wordCount': word_count,
        'basePrice': base_price * exchange_rate,
        'turnaroundMultiplier': multiplier,
        'subtotal': adjusted_subtotal * exchange_rate,
        'vatAmount': vat_amount * exchange_rate,
        'total': total * exchange_rate,
        'currency': currency,
        'exchangeRate': exchange_rate,
        'validUntil': (datetime.utcnow() + timedelta(days=1)).isoformat()
    })

@bp.route('/pricing', methods=['GET'])
def get_pricing():
    return jsonify([
        {'serviceType': 'proofreading', 'pricePerWord': '0.08', 'minPrice': '50.00'},
        {'serviceType': 'editing', 'pricePerWord': '0.15', 'minPrice': '50.00'},
        {'serviceType': 'formatting', 'pricePerWord': '0.10', 'minPrice': '50.00'}
    ])

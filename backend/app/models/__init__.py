from sqlalchemy import Column, String, Integer, Text, Boolean, Numeric, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class ServiceType(enum.Enum):
    proofreading = 'proofreading'
    editing = 'editing'
    formatting = 'formatting'

class Turnaround(enum.Enum):
    h24 = '24h'
    h48 = '48h'
    h72 = '72h'
    week1 = '1week'

class JobStatus(enum.Enum):
    draft = 'draft'
    quoted = 'quoted'
    pending_payment = 'pending_payment'
    paid = 'paid'
    assigned = 'assigned'
    in_review = 'in_review'
    revision_requested = 'revision_requested'
    completed = 'completed'
    cancelled = 'cancelled'
    disputed = 'disputed'

class UserRole(enum.Enum):
    customer = 'customer'
    reviewer = 'reviewer'
    admin = 'admin'

class Currency(enum.Enum):
    ZAR = 'ZAR'
    USD = 'USD'
    EUR = 'EUR'
    GBP = 'GBP'

class PaymentStatus(enum.Enum):
    pending = 'pending'
    processing = 'processing'
    completed = 'completed'
    failed = 'failed'
    refunded = 'refunded'


class User(Base):
    __tablename__ = 'users'
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    profile_image_url = Column(String)
    role = Column(String, default='customer')
    phone = Column(String)
    company = Column(String)
    preferred_currency = Column(String, default='ZAR')
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    customer_jobs = relationship('Job', back_populates='customer', foreign_keys='Job.customer_id')
    reviewer_jobs = relationship('Job', back_populates='reviewer', foreign_keys='Job.reviewer_id')


class ReviewerProfile(Base):
    __tablename__ = 'reviewer_profiles'
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'))
    specializations = Column(JSON)
    years_experience = Column(Integer, default=0)
    bio = Column(Text)
    rating = Column(Numeric(3, 2), default=5.00)
    completed_jobs = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)
    max_concurrent_jobs = Column(Integer, default=5)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Job(Base):
    __tablename__ = 'jobs'
    
    id = Column(String, primary_key=True)
    customer_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'))
    reviewer_id = Column(String, ForeignKey('users.id'))
    service_type = Column(String)
    turnaround = Column(String)
    status = Column(String, default='draft')
    title = Column(String)
    instructions = Column(Text)
    word_count = Column(Integer, default=0)
    deadline = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    customer = relationship('User', back_populates='customer_jobs', foreign_keys=[customer_id])
    reviewer = relationship('User', back_populates='reviewer_jobs', foreign_keys=[reviewer_id])
    files = relationship('JobFile', back_populates='job')
    quotes = relationship('Quote', back_populates='job')


class JobFile(Base):
    __tablename__ = 'job_files'
    
    id = Column(String, primary_key=True)
    job_id = Column(String, ForeignKey('jobs.id', ondelete='CASCADE'))
    filename = Column(String)
    original_name = Column(String)
    mime_type = Column(String)
    size = Column(Integer)
    storage_path = Column(String)
    is_original = Column(Boolean, default=True)
    virus_scan_status = Column(String, default='pending')
    uploaded_at = Column(DateTime, server_default=func.now())
    
    job = relationship('Job', back_populates='files')


class Quote(Base):
    __tablename__ = 'quotes'
    
    id = Column(String, primary_key=True)
    job_id = Column(String, ForeignKey('jobs.id', ondelete='CASCADE'))
    word_count = Column(Integer)
    base_price = Column(Numeric(10, 2))
    turnaround_multiplier = Column(Numeric(4, 2), default=1.00)
    subtotal = Column(Numeric(10, 2))
    vat_amount = Column(Numeric(10, 2), default=0.00)
    total = Column(Numeric(10, 2))
    currency = Column(String, default='ZAR')
    exchange_rate = Column(Numeric(10, 6), default=1.000000)
    valid_until = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    
    job = relationship('Job', back_populates='quotes')


class Order(Base):
    __tablename__ = 'orders'
    
    id = Column(String, primary_key=True)
    job_id = Column(String, ForeignKey('jobs.id', ondelete='CASCADE'))
    quote_id = Column(String, ForeignKey('quotes.id'))
    customer_id = Column(String, ForeignKey('users.id'))
    order_number = Column(String, unique=True)
    status = Column(String, default='pending')
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Payment(Base):
    __tablename__ = 'payments'
    
    id = Column(String, primary_key=True)
    order_id = Column(String, ForeignKey('orders.id', ondelete='CASCADE'))
    gateway = Column(String)
    gateway_transaction_id = Column(String)
    amount = Column(Numeric(10, 2))
    currency = Column(String, default='ZAR')
    status = Column(String, default='pending')
    paid_at = Column(DateTime)
    metadata = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Invoice(Base):
    __tablename__ = 'invoices'
    
    id = Column(String, primary_key=True)
    order_id = Column(String, ForeignKey('orders.id', ondelete='CASCADE'))
    invoice_number = Column(String, unique=True)
    customer_name = Column(String)
    customer_email = Column(String)
    customer_address = Column(Text)
    vat_number = Column(String)
    subtotal = Column(Numeric(10, 2))
    vat_amount = Column(Numeric(10, 2), default=0.00)
    total = Column(Numeric(10, 2))
    currency = Column(String, default='ZAR')
    issued_at = Column(DateTime, server_default=func.now())
    pdf_path = Column(String)


class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'))
    type = Column(String)
    title = Column(String)
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    metadata = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())


class Dispute(Base):
    __tablename__ = 'disputes'
    
    id = Column(String, primary_key=True)
    job_id = Column(String, ForeignKey('jobs.id', ondelete='CASCADE'))
    raised_by_id = Column(String, ForeignKey('users.id'))
    reason = Column(Text)
    status = Column(String, default='open')
    resolution = Column(Text)
    resolved_by_id = Column(String, ForeignKey('users.id'))
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class PricingConfig(Base):
    __tablename__ = 'pricing_config'
    
    id = Column(String, primary_key=True)
    service_type = Column(String)
    price_per_word = Column(Numeric(6, 4))
    min_price = Column(Numeric(10, 2), default=50.00)
    turnaround_24h_multiplier = Column(Numeric(4, 2), default=2.00)
    turnaround_48h_multiplier = Column(Numeric(4, 2), default=1.50)
    turnaround_72h_multiplier = Column(Numeric(4, 2), default=1.25)
    turnaround_1week_multiplier = Column(Numeric(4, 2), default=1.00)
    vat_rate = Column(Numeric(5, 2), default=15.00)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

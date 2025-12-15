import os
from flask import Flask
from flask_cors import CORS
from flask_session import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

db_engine = None
db_session = None

def create_app():
    global db_engine, db_session
    
    app = Flask(__name__)
    app.secret_key = os.environ.get('SESSION_SECRET', 'dev-secret-key-change-in-production')
    
    CORS(app, supports_credentials=True, origins=['*'])
    
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_PERMANENT'] = False
    Session(app)
    
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        db_engine = create_engine(database_url)
        session_factory = sessionmaker(bind=db_engine)
        db_session = scoped_session(session_factory)
    
    from app.routes import auth, jobs, quotes, admin
    app.register_blueprint(auth.bp)
    app.register_blueprint(jobs.bp)
    app.register_blueprint(quotes.bp)
    app.register_blueprint(admin.bp)
    
    return app

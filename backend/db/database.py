from fastapi import FastAPI, Request, Response, Cookie
from datetime import datetime, timedelta, timezone
import sqlite3
import threading
import time
import logging
from io import BytesIO
from dataclasses import dataclass
from dotenv import load_dotenv
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.db_models import Base, Session, Edits
from models.global_edits import Payload
import json
from models.global_edits import GlobalEdit
SESSION_COOKIE = "session_id"


@dataclass
class Data:
    sid: str
    signed_id: str
    data: BytesIO
    last_access: datetime
    payload: Payload


class Database:

    """
    A server-side session manager that:
    - Stores session data in a SQLite database (server-side, secure).
    - Associates each user with a session ID stored in a signed cookie.
    - Expires sessions after a configurable timeout period.
    - Cleans up expired sessions periodically in the background.

    Security features:
    - Session IDs are signed with HMAC-SHA256 so they cannot be forged by clients.
    - Actual session data never leaves the server; only the signed ID is stored in the browser.

    Data format:
    - Session data is stored as JSON in the database for safety and portability.
    """

    def __init__(self, timeout_minutes=30, cleanup_interval=300):
        """
        Initialize the session storage.

        Args:
            db_path (str): Path to SQLite database file.
            secret_key (str): Key used for signing cookies. Randomly generated if None.
            timeout_minutes (int): Session expiration time in minutes.
            cleanup_interval (int): How often to run cleanup (in seconds).
        """
        self.logger = logging.getLogger(__name__)
        if not load_dotenv(dotenv_path=os.path.join("db", "db.env")):
            self.logger.critical(f"No db.env found at: {os.path.join('db', 'db.env')}. Terminating Program.")
            raise RuntimeError("Fatal error no db.env file found! There is no valid Database!")
        
        DB_USER = os.getenv("DB_USER")
        DB_PASS = os.getenv("DB_PASS")
        DB_NAME = os.getenv("DB_NAME")
        DB_HOST = os.getenv("DB_HOST", "localhost")
        DB_PORT = os.getenv("DB_PORT", 5432)

        DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        engine = create_engine(DATABASE_URL, echo=False)  # echo=True prints SQL queries
        SessionLocal = sessionmaker(autocommit=False, autoflush=True, bind=engine, expire_on_commit=True)
        
        Base.metadata.create_all(engine)
        
        self.db = SessionLocal()
        
        self.timeout = timedelta(minutes=timeout_minutes)
        self.cleanup_interval = cleanup_interval

        self.logger.info(f"Successfully setup tables and connected to DB!")
        self.logger.info(f"Session timeout set to {timeout_minutes} minutes")
        self.logger.info(f"Session cleanup interval set to {cleanup_interval} seconds")

        threading.Thread(target=self._auto_cleanup, daemon=True).start()

    # --------------------------------------------------------
    # database operations
    # --------------------------------------------------------

    # --------------------------------------------------------
    # Add row to the database.
    # --------------------------------------------------------
    def add_row(self, data: Data):
        session = Session(sid=data.sid, signed_sid=data.signed_id, data=data.data, last_access=data.last_access)
        json_data = data.payload.edits.model_dump_json()
        edits = Edits(session_sid=data.sid, edits=json_data)
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        
        self.db.add(edits)
        self.db.commit()
        self.db.refresh(edits)
        self.logger.info(f"Adding Row to DB!")
        
    def get_all_signed_sids(self):
        res = self.db.query(Session.signed_sid).all()
        signed_sids = [r[0] for r in res]
        self.logger.info(f"Getting all signed sessions ids from Session table.")
        return signed_sids
        
    def get_data_last_access(self, sid: str):
        res = self.db.query(Session.data, Session.last_access).filter(Session.sid == sid).first()
        self.logger.info(f"Getting data and last_access from Session table.")
        if res:
            data, last_access = res
            self.update_last_access(sid)
            return data, last_access

        self.logger.warning(f"No data and last_access found in Session table.")
        return None, None
   
    
    def get_data(self, sid: str):
        res = self.db.query(Session.data).filter(Session.sid == sid).first()
        self.logger.info(f"Getting data from Session table.")
        if res is not None:
            self.update_last_access(sid)
            return res[0]
        else:
            self.logger.warning(f"No data found in Session table.")
            return None
    
    def get_edits(self, sid: str):
        res = self.db.query(Edits.edits).filter(Edits.session_sid == sid).first()
        self.logger.info(f"Getting edits from Edits table.")
        
        if res is not None:
            data = json.loads(res[0])
            edits = GlobalEdit(**data)
            return edits
        else:
            self.logger.warning(f"No Edits found in Edits table.")
            return None
    
    def update_last_access(self, sid: str, last_access: datetime = datetime.now(timezone.utc).isoformat()):
        session_obj = self.db.query(Session).filter(Session.sid == sid).first()
        if session_obj:
            session_obj.last_access = last_access
            self.db.commit()
            self.logger.info(f"Successfully updated last_access in Session table to: {last_access}")
        else:
            self.logger.warning(f"No Session obj with session id found in DB.")
        
    ############################################################################################
    # Updates data in the current session.
    # Looks up the signed session ID from the request, verifies it, 
    # and updates the stored session record with new data.
    # Params: data (dict) - session fields to store
    # Returns: bool indicating success
    ############################################################################################
    def update_session_data(self, sid, data: bytes):
        session_obj = self.db.query(Session).filter(Session.sid == sid).first()
        if session_obj:
            session_obj.data = data
            session_obj.last_access = datetime.now(timezone.utc).isoformat()
            self.db.commit()
            self.db.refresh(session_obj)
            self.logger.info(f"Successfully updated data and last_access in Session table.")
            return True
        else:
            self.logger.warning(f"No Session obj with session id found in DB.")
            return False

    def update_session_edits(self, sid, payload: Payload):
        Edits_obj = self.db.query(Edits).filter(Edits.session_sid == sid).first()
        if Edits_obj:
            Edits_obj.edits = payload.edits.model_dump_json()
            self.update_last_access(sid)
            self.db.commit()
            self.logger.info(f"Successfully updated edits in Edits table.")
        else:
            self.logger.warning(f"No Edits obj with session id found in DB.")
            
    def delete_session(self, sid):
        session_obj = self.db.query(Session).filter(Session.id == sid).first()
        if session_obj:
            self.db.delete(session_obj)
            self.db.commit()
            self.logger.info(f"Deleted session!")
        else:
            self.logger.warning(f"No Session obj with session id found in DB.")
    
    def cleanup(self):
        cutoff = datetime.now(timezone.utc) - self.timeout
        
        old_sessions = self.db.query(Session).filter(Session.last_access < cutoff.isoformat()).all()
        for session in old_sessions:
            self.db.delete(session)
            self.db.commit()
     
        self.logger.info(f"Cleaned up {len(old_sessions)} expired sessions")
    
    def _auto_cleanup(self):
        self.logger.info("Started background cleanup thread")
        while True:
            time.sleep(self.cleanup_interval)
            try:
                self.cleanup()
            except Exception as e:
                self.logger.error(f"Error during session cleanup: {e}")
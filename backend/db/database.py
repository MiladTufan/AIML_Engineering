from fastapi import FastAPI, Request, Response, Cookie
from datetime import datetime, timedelta, timezone
import sqlite3
import uuid
import os 
import json
import hmac
import hashlib
import secrets
import threading
import time
import logging
from io import BytesIO
from dataclasses import dataclass

SESSION_COOKIE = "session_id"

@dataclass
class Data:
    sid: str
    signed_id: str
    data: BytesIO
    last_access: datetime


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

    def __init__(self, db_path="db/sessions.db", secret_key=None, timeout_minutes=30, cleanup_interval=300):
        """
        Initialize the session storage.

        Args:
            db_path (str): Path to SQLite database file.
            secret_key (str): Key used for signing cookies. Randomly generated if None.
            timeout_minutes (int): Session expiration time in minutes.
            cleanup_interval (int): How often to run cleanup (in seconds).
        """

        # Connect to SQLite database (thread-safe for FastAPI when check_same_thread=False)
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.cur = self.conn.cursor()

        # Create table if it doesn't exist
        self.cur.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            signed_id TEXT,
            data BLOB,
            last_access TIMESTAMP
        )
        """)
        self.conn.commit()

        
        # self.secret_key = secret_key or os.environ.get("SESSION_SECRET_KEY")
        # Use provided secret key or generate one
        self.secret_key = secret_key or secrets.token_hex(32)

        if not self.secret_key:
            raise RuntimeError("No secret key provided! Set SESSION_SECRET_KEY env variable.")

        self.timeout = timedelta(minutes=timeout_minutes)
        self.cleanup_interval = cleanup_interval

        self.logger = logging.getLogger("SessionDB")
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
        self.cur.execute("INSERT INTO sessions VALUES (?, ?, ?, ?)",
                         (data.sid, data.signed_id, data.data, data.last_access))
        

        self.conn.commit()

    def get_data_last_access(self, sid: str):
        self.cur.execute("SELECT data, last_access FROM sessions WHERE id = ?", (sid,))
        row = self.cur.fetchone()

        if not row:
            self.logger.info(f"Session {sid} not found")
            return {"exits" : False}
        return {"exits" : row}
    
    def get_data(self, sid: str):
        self.cur.execute("SELECT data FROM sessions WHERE id = ?", (sid,))
        row = self.cur.fetchone()

        if not row:
            self.logger.info(f"Session {sid} not found")
            return {"exists" : False}
        return {"exists" : row}
    
    def update_last_access(self, sid: str, last_access: datetime):
        self.cur.execute("UPDATE sessions SET last_access = ? WHERE id = ?",
                            (last_access, sid))

    ############################################################################################
    # Updates data in the current session.
    # Looks up the signed session ID from the request, verifies it, 
    # and updates the stored session record with new data.
    # Params: data (dict) - session fields to store
    # Returns: bool indicating success
    ############################################################################################
    def update_session_data(self, sid, data: bytes):
        self.cur.execute("UPDATE sessions SET data = ?, last_access = ? WHERE id = ?",
                         (data, datetime.utcnow().isoformat(), sid))
        
        self.conn.commit()
        self.logger.debug(f"Session {sid} data saved")
        return None
    
    
    def delete_session(self, sid):
        self.cur.execute("DELETE FROM sessions WHERE id = ?", (sid,))
        self.conn.commit()
        self.logger.info(f"Deleted session {sid}")
        return None
    
    def cleanup(self):
        cutoff = datetime.now(timezone.utc) - self.timeout

        self.cur.execute("DELETE FROM sessions WHERE last_access < ?", (cutoff.isoformat(), ))
        deleted_count = self.cur.rowcount
        self.conn.commit()
        self.logger.info(f"Cleaned up {deleted_count} expired sessions")
    
    def _auto_cleanup(self):
        self.logger.info("Started background cleanup thread")
        while True:
            time.sleep(self.cleanup_interval)
            try:
                self.cleanup()
            except Exception as e:
                self.logger.error(f"Error during session cleanup: {e}")
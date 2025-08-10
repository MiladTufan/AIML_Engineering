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

SESSION_COOKIE = "session_id"

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

    def __init__(self, db_path="sessions.db", secret_key=None, timeout_minutes=30, cleanup_interval=300):
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
            data TEXT,
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
    # Cookie signing methods
    # --------------------------------------------------------
    def sign_id(self, sid: str):
        """
        Sign a session ID with HMAC-SHA256 for security.

        This ensures that if a user tries to modify the cookie value,
        the server will reject it because the signature won't match.

        Args:
            sid (str): Unsigned session ID.

        Returns:
            str: Signed session ID in the format "sid.signature".
        """

        sig = hmac.new(self.secret_key.encode(), sid.encode(), hashlib.sha256).hexdigest()
        signed = f"{sid}.{sig}"
        self.logger.debug(f"Signing session ID {sid} -> {signed}")
        return signed
    
    def verify_id(self, signed_sid):
        """
        Verify a signed session ID.

        Args:
            signed_sid (str): The signed session ID from the browser cookie.

        Returns:
            str or None: The original session ID if valid, otherwise None.
        """

        try:
            sid, sig = signed_sid.split(".")
            expected_sig = hmac.new(self.secret_key.encode(), sid.encode(), hashlib.sha256).hexdigest()

            if hmac.compare_digest(sig, expected_sig):
                self.logger.debug(f"Verified session ID {sid} successfully")
                return sid
            else:
                self.logger.warning(f"Session ID signature mismatch: {signed_sid}")
                return None
        except:
            self.logger.warning(f"Invalid session ID format: {signed_sid}")
            return None
    
    def create_session(self):
        sid = str(uuid.uuid4())
        self.cur.execute("INSERT INTO sessions VALUES (?, ?, ?)",
                         (sid, json.dumps({}), datetime.now(timezone.utc).isoformat()))

        self.conn.commit()
        self.logger.info(f"Created new session: {sid}")
        return sid

    def get_session(self, sid):
        self.cur.execute("SELECT data, last_access FROM sessions WHERE id = ?", (sid,))

        row = self.cur.fetchone()

        if not row:
            self.logger.info(f"Session {sid} not found")
            return None
        
        data, last_access = row
        last_access_dt = datetime.fromisoformat(last_access)
        if last_access_dt.tzinfo is None:
            last_access_dt = last_access_dt.replace(tzinfo=timezone.utc)  # make aware

        if datetime.now(timezone.utc) - last_access_dt > self.timeout:
            self.logger.info(f"Session {sid} expired, deleting")
            self.delete_session(sid)
            return None
        
        self.cur.execute("UPDATE sessions SET last_access = ? WHERE id = ?",
                          (datetime.now(timezone.utc).isoformat(), sid))
        
        self.conn.commit()
        self.logger.debug(f"Session {sid} accessed and last_access updated")
        return json.loads(data)
    
    def save_session(self, sid, data):
        self.cur.execute("UPDATE sessions SET data = ?, last_access = ? WHERE id = ?",
                         (json.dumps(data), datetime.utcnow().isoformat(), sid))
        
        self.conn.commit()
        self.logger.debug(f"Session {sid} data saved")

    def delete_session(self, sid):
        self.cur.execute("DELETE FROM sessions WHERE id = ?", (sid,))
        self.conn.commit()
        self.logger.info(f"Deleted session {sid}")
    
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
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

from db.database import Database, Data


class SessionAPI:
    def __init__(self, secret_key=None):

        self.db = Database()
        self.secret_key = secret_key or secrets.token_hex(32)
        if not self.secret_key:
            raise RuntimeError("No secret key provided! Set SESSION_SECRET_KEY env variable.")

    ############################################################################################
    # Generates a signed session ID from a raw session ID.
    # Uses HMAC with a secret key to sign the raw session ID 
    # and appends the signature.
    # Params: raw_sid (str) - raw session ID
    # Returns: str containing "raw_sid.signature"
    ############################################################################################
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
    
    ############################################################################################
    # Verifies that a signed session ID is valid.
    # Splits the raw session ID and signature, recomputes the HMAC, 
    # and checks if they match.
    # Params: signed_sid (str) - signed session ID
    # Returns: The original session ID if valid, otherwise None.
    ############################################################################################
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
            expected_sig = self.sign_id(sid).split(".")[1]
            
            if hmac.compare_digest(sig, expected_sig):
                self.logger.debug(f"Verified session ID {sid} successfully")
                return sid, expected_sig
            else:
                self.logger.warning(f"Session ID signature mismatch: {signed_sid}")
                return None
        except:
            self.logger.warning(f"Invalid session ID format: {signed_sid}")
            return None
    
    ############################################################################################
    # Creates a new user session.
    # Generates a raw session ID, signs it with HMAC for integrity, 
    # stores the signed session in the database, and returns it to the client.
    # Params: None (relies on request context)
    # Returns: dict containing the signed session ID
    ############################################################################################
    def create_session(self):
        sid, sig = self.sign_id(str(uuid.uuid4())).split(".")
        data = Data(sid, sig, BytesIO(), datetime.now(timezone.utc).isoformat())
        self.db.add_row(data)
   
        self.logger.info(f"Created new session: {sig}")
        return {"signed_session_id": sig}
    

    ############################################################################################
    # Retrieves session data for the current user.
    # Reads the signed session ID from the request cookies, verifies it, 
    # and fetches associated session data from the database.
    # Params: None (relies on request context)
    # Returns: dict containing session data or None if not found/invalid
    ############################################################################################
    def get_session(self, sid):
        self.cur.execute("SELECT data, last_access FROM sessions WHERE id = ?", (sid,))

        row = self.cur.fetchone()

        if not row:
            self.logger.info(f"Session {sid} not found")
            return {"exits" : False}
        
        data, last_access = row
        last_access_dt = datetime.fromisoformat(last_access)
        if last_access_dt.tzinfo is None:
            last_access_dt = last_access_dt.replace(tzinfo=timezone.utc)  # make aware

        if datetime.now(timezone.utc) - last_access_dt > self.timeout:
            self.logger.info(f"Session {sid} expired, deleting")
            self.delete_session(sid)
            return {"exits" : False}
        
        self.cur.execute("UPDATE sessions SET last_access = ? WHERE id = ?",
                            (datetime.now(timezone.utc).isoformat(), sid))
        
        self.conn.commit()
        self.logger.debug(f"Session {sid} accessed and last_access updated")
        return data
    
    ############################################################################################
    # Saves or updates data in the current session.
    # Looks up the signed session ID from the request, verifies it, 
    # and updates the stored session record with new data.
    # Params: data (dict) - session fields to store
    # Returns: bool indicating success
    ############################################################################################
    def save_session(self, sid, data: BytesIO):
        self.cur.execute("UPDATE sessions SET data = ?, last_access = ? WHERE id = ?",
                         (data, datetime.utcnow().isoformat(), sid))
        
        self.conn.commit()
        self.logger.debug(f"Session {sid} data saved")
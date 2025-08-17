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
from dotenv import load_dotenv

from db.database import Database, Data
from models.global_edits import Payload, init_payload

class SessionAPI:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.db = Database()
        self.secret_key = None
        if load_dotenv(dotenv_path=os.path.join("db", "dev.env")):
            self.secret_key = os.environ.get("SECRET_TOKEN")
        else:
            with open(os.path.join("db", "dev.env"), "w") as f:
                f.write(f"SECRET_TOKEN={secrets.token_hex(32)}\n")

            load_dotenv(dotenv_path=os.path.join("db", "dev.env"))
            self.secret_key = os.environ.get("SECRET_TOKEN")

        if not self.secret_key:
            self.logger.critical("No secrect key found can not verify any keys! Terminating Program!")
            self.logger.exception("No secret key provided! Set SESSION_SECRET_KEY env variable.")
            raise

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
        self.logger.info(f"Signing session ID.")
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
                self.logger.info(f"Verified session ID successfully")
                return {"sid": sid, "sig": expected_sig}
            else:
                self.logger.info(f"Session ID signature mismatch")
                return None
        except:
            self.logger.info(f"Invalid session ID format")
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
        
        init_payload.signed_id = sig
        data = Data(sid, sig, b'', datetime.now(timezone.utc).isoformat(), init_payload)
        self.db.add_row(data)
   
        self.logger.info(f"Created new session!")
        return {"signed_sid": f"{sid}.{sig}"}
    

    ############################################################################################
    # Retrieves session data for the current user.
    # Reads the signed session ID from the request cookies, verifies it, 
    # and fetches associated session data from the database.
    # Params: None (relies on request context)
    # Returns: dict containing session data or None if not found/invalid
    ############################################################################################
    def get_session(self, sid):
        data, last_access = self.db.get_data_last_access(sid)
        if data is None or last_access is None:
            return False
        
        last_access_dt = datetime.fromisoformat(last_access)
        if last_access_dt.tzinfo is None:
            last_access_dt = last_access_dt.replace(tzinfo=timezone.utc)  # make aware

        if datetime.now(timezone.utc) - last_access_dt > self.db.timeout:
            self.logger.info(f"Session expired, deleting")
            self.db.delete_session(sid)
            return {"exits" : False}
        
        self.db.update_last_access(sid, datetime.now(timezone.utc).isoformat())
        
        self.logger.debug(f"Session accessed and last_access updated")
        return data
    

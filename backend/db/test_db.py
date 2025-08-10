import pytest
import time
from datetime import datetime, timedelta
from fastapi import FastAPI, Request, Response
from fastapi.testclient import TestClient

from database import Database #, app, SESSION_COOKIE  # adjust import as needed


@pytest.fixture
def session_db():
    # Use an in-memory SQLite DB for testing (does not persist)
    return Database(db_path=":memory:", timeout_minutes=1, cleanup_interval=1)


def test_create_and_get_session(session_db):
    sid = session_db.create_session()
    assert sid is not None

    data = session_db.get_session(sid)
    assert isinstance(data, dict)
    assert data == {}

def test_save_and_retrieve_session_data(session_db):
    sid = session_db.create_session()
    session_db.save_session(sid, {"user": "alice"})
    data = session_db.get_session(sid)
    assert data == {"user": "alice"}

def test_session_expiration(session_db):
    sid = session_db.create_session()
    session_db.save_session(sid, {"foo": "bar"})

    # Manually update last_access to expire session
    past = datetime.utcnow() - timedelta(minutes=2)
    session_db.cur.execute(
        "UPDATE sessions SET last_access = ? WHERE id = ?",
        (past.isoformat(), sid)
    )
    session_db.conn.commit()

    data = session_db.get_session(sid)
    assert data is None  # Should be expired and deleted

def test_delete_session(session_db):
    sid = session_db.create_session()
    session_db.delete_session(sid)
    data = session_db.get_session(sid)
    assert data is None

def test_sign_and_verify_id(session_db):
    sid = session_db.create_session()
    signed = session_db.sign_id(sid)
    verified = session_db.verify_id(signed)
    assert verified == sid

    # Tamper with signature
    parts = signed.split(".")
    tampered = parts[0] + ".bad_signature"
    verified2 = session_db.verify_id(tampered)
    assert verified2 is None

def test_cleanup(session_db):
    # Create two sessions, expire one
    sid1 = session_db.create_session()
    sid2 = session_db.create_session()

    past = datetime.utcnow() - timedelta(minutes=2)
    session_db.cur.execute(
        "UPDATE sessions SET last_access = ? WHERE id = ?",
        (past.isoformat(), sid1)
    )
    session_db.conn.commit()

    session_db.cleanup()

    assert session_db.get_session(sid1) is None
    assert session_db.get_session(sid2) is not None

# # -------------------------------
# # FastAPI middleware and endpoints
# # -------------------------------

# @pytest.fixture
# def client():
#     # Use the FastAPI TestClient
#     return TestClient(app)

# def test_set_and_get_session(client):
#     # Test /set sets username in session and /get retrieves it

#     response_set = client.get("/set")
#     assert response_set.status_code == 200
#     cookie = response_set.cookies.get(SESSION_COOKIE)
#     assert cookie is not None

#     # Use the cookie for the next request to keep session
#     response_get = client.get("/get", cookies={SESSION_COOKIE: cookie})
#     assert response_get.status_code == 200
#     assert response_get.json()["username"] == "Alice"

# def test_get_without_session_returns_guest(client):
#     # Without session cookie, should get default username "Guest"
#     response = client.get("/get")
#     assert response.status_code == 200
#     assert response.json()["username"] == "Guest"

# def test_logout_clears_session(client):
#     response_set = client.get("/set")
#     cookie = response_set.cookies.get(SESSION_COOKIE)

#     response_logout = client.get("/logout", cookies={SESSION_COOKIE: cookie})
#     assert response_logout.status_code == 200
#     assert "Logged out" in response_logout.json().get("message", "")

#     # Subsequent /get should return Guest because session deleted
#     response_get = client.get("/get", cookies={SESSION_COOKIE: cookie})
#     assert response_get.json()["username"] == "Guest"

# def test_session_persists_across_requests(client):
#     # Set username to Alice
#     r1 = client.get("/set")
#     cookie = r1.cookies.get(SESSION_COOKIE)
#     assert cookie is not None

#     # Change session data manually through middleware
#     r2 = client.get("/get", cookies={SESSION_COOKIE: cookie})
#     assert r2.json()["username"] == "Alice"

#     # Now simulate updating session data: add new key in middleware
#     # (simulate by making a new endpoint or patching the session object)
#     # For simplicity, here we just check the username persists

#     r3 = client.get("/get", cookies={SESSION_COOKIE: cookie})
#     assert r3.json()["username"] == "Alice"

from sqlalchemy import Column, Integer, String, ForeignKey, Column, String, LargeBinary, DateTime, JSON
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime, timedelta, timezone


Base = declarative_base()

class Session(Base):
    __tablename__ = "Session"
    sid = Column(String, primary_key=True)           # TEXT -> String
    signed_sid = Column(String, nullable=True)       # TEXT -> String
    data = Column(LargeBinary, nullable=True)      # BLOB -> LargeBinary
    last_access = Column(DateTime, default=datetime.now(timezone.utc))  # TIMESTAMP
    l = relationship("Edits", back_populates="parent", cascade="all, delete-orphan")

class Edits(Base):
    __tablename__ = "Edits"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_sid = Column(String, ForeignKey("Session.sid"))
    edits = Column(JSON)
    parent = relationship("Session", back_populates="l")
    

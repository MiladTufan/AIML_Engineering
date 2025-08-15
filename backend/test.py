from sqlalchemy import Column, Integer, String, ForeignKey, create_engine
from sqlalchemy.orm import relationship, sessionmaker, declarative_base

# --- Setup ---
Base = declarative_base()

# Change this to your PostgreSQL credentials
DATABASE_URL = "postgresql+psycopg2://user:password@localhost:5432/mydb"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine)

# --- Models ---
class Obj(Base):
    __tablename__ = "obj"
    id = Column(Integer, primary_key=True, autoincrement=True)

    # one-to-many relationship: Obj → Obj2
    l = relationship("Obj2", back_populates="parent", cascade="all, delete-orphan")

class Obj2(Base):
    __tablename__ = "obj2"
    id = Column(Integer, primary_key=True, autoincrement=True)
    obj_id = Column(Integer, ForeignKey("obj.id"))
    name = Column(String)
    value = Column(Integer)

    parent = relationship("Obj", back_populates="l")

# --- Create tables ---
Base.metadata.create_all(engine)

# --- Example usage ---
def run_example():
    db = SessionLocal()

    # Create Obj with children
    obj = Obj(l=[
        Obj2(name="apple", value=10),
        Obj2(name="banana", value=20)
    ])
    db.add(obj)
    db.commit()

    # Query back
    result = db.query(Obj).first()
    print(f"Obj ID: {result.id}")
    for child in result.l:
        print(f"  Child: {child.name} = {child.value}")

if __name__ == "__main__":
    run_example()

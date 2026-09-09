from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from app.core.config import settings

Base=declarative_base()
connect_args={"check_same_thread":False} if settings.database_url.startswith("sqlite") else {}
engine=create_engine(settings.database_url, connect_args=connect_args)
SessionLocal=sessionmaker(bind=engine, autoflush=False, autocommit=False)

class User(Base):
    __tablename__="users"; id=Column(Integer,primary_key=True); username=Column(String,unique=True,index=True); password_hash=Column(String); created_at=Column(DateTime,default=datetime.utcnow)
class KnowledgeBase(Base):
    __tablename__="knowledge_bases"; id=Column(Integer,primary_key=True); name=Column(String); description=Column(Text); owner_id=Column(Integer,ForeignKey("users.id")); created_at=Column(DateTime,default=datetime.utcnow)
class Document(Base):
    __tablename__="documents"; id=Column(Integer,primary_key=True); knowledge_base_id=Column(Integer,ForeignKey("knowledge_bases.id"),index=True); filename=Column(String); stored_filename=Column(String); file_hash=Column(String,index=True); mime_type=Column(String); size=Column(Integer); status=Column(String,default="UPLOADED"); created_at=Column(DateTime,default=datetime.utcnow)
class Chunk(Base):
    __tablename__="chunks"; id=Column(Integer,primary_key=True); document_id=Column(Integer,ForeignKey("documents.id"),index=True); chunk_index=Column(Integer); text=Column(Text); page=Column(Integer); section=Column(String); token_count=Column(Integer); created_at=Column(DateTime,default=datetime.utcnow)
class Conversation(Base):
    __tablename__="conversations"; id=Column(Integer,primary_key=True); user_id=Column(Integer); knowledge_base_id=Column(Integer); created_at=Column(DateTime,default=datetime.utcnow)
class Message(Base):
    __tablename__="messages"; id=Column(Integer,primary_key=True); conversation_id=Column(Integer,ForeignKey("conversations.id")); role=Column(String); content=Column(Text); created_at=Column(DateTime,default=datetime.utcnow)
class RetrievalLog(Base):
    __tablename__="retrieval_logs"; id=Column(Integer,primary_key=True); message_id=Column(Integer); chunk_id=Column(Integer); similarity=Column(Float); rank=Column(Integer)

def init_db(): Base.metadata.create_all(bind=engine)
def get_db():
    db=SessionLocal()
    try: yield db
    finally: db.close()

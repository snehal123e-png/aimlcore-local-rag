from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.models.db import get_db,KnowledgeBase
from app.schemas.common import ChatRequest
from app.services.rag import answer
router=APIRouter(prefix="/api/chat",tags=["Chat"])
@router.post("")
def chat(body:ChatRequest,db:Session=Depends(get_db)):
    if not db.get(KnowledgeBase,body.knowledge_base_id): raise HTTPException(404,"Knowledge base not found")
    return answer(db,body.knowledge_base_id,body.question)

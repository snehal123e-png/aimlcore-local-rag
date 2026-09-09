from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.models.db import get_db,KnowledgeBase
from app.services.embeddings.embedder import get_embedder
from app.services.retrieval.faiss_store import search
router=APIRouter(prefix="/api/search",tags=["Search"])
@router.get("")
def semantic_search(knowledge_base_id:int,q:str,k:int=5,db:Session=Depends(get_db)):
    if not db.get(KnowledgeBase,knowledge_base_id): raise HTTPException(404,"Knowledge base not found")
    return search(knowledge_base_id,get_embedder().encode([q]),k)

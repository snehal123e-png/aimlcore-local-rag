from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.models.db import get_db,KnowledgeBase,Document,Chunk
from app.schemas.common import KnowledgeBaseCreate
router=APIRouter(prefix="/api/knowledge-bases",tags=["Knowledge Bases"])
@router.get("")
def list_kbs(db:Session=Depends(get_db)):
    return [{"id":k.id,"name":k.name,"description":k.description,"document_count":db.query(Document).filter(Document.knowledge_base_id==k.id).count(),"chunk_count":db.query(Chunk).join(Document).filter(Document.knowledge_base_id==k.id).count()} for k in db.query(KnowledgeBase).all()]
@router.post("")
def create_kb(body:KnowledgeBaseCreate,db:Session=Depends(get_db)):
    k=KnowledgeBase(name=body.name,description=body.description,owner_id=1); db.add(k); db.commit(); db.refresh(k); return {"id":k.id,"name":k.name,"description":k.description}
@router.delete("/{kb_id}")
def delete_kb(kb_id:int,db:Session=Depends(get_db)):
    k=db.get(KnowledgeBase,kb_id)
    if not k: raise HTTPException(404,"Knowledge base not found")
    db.query(Chunk).filter(Chunk.document_id.in_(db.query(Document.id).filter(Document.knowledge_base_id==kb_id))).delete(synchronize_session=False)
    db.query(Document).filter(Document.knowledge_base_id==kb_id).delete(synchronize_session=False); db.delete(k); db.commit(); return {"deleted":True}

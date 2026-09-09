from pathlib import Path
from fastapi import APIRouter,Depends,HTTPException,UploadFile,File
from sqlalchemy.orm import Session
from app.models.db import get_db,Document,KnowledgeBase,Chunk
from app.core.security import validate_extension,validate_file_size,calculate_file_hash,generate_safe_filename
from app.core.config import settings
from app.services.rag import process_document
router=APIRouter(prefix="/api/documents",tags=["Documents"])
@router.get("")
def list_documents(knowledge_base_id:int|None=None,db:Session=Depends(get_db)):
    q=db.query(Document); q=q.filter(Document.knowledge_base_id==knowledge_base_id) if knowledge_base_id else q
    return [{"id":d.id,"knowledge_base_id":d.knowledge_base_id,"filename":d.filename,"size":d.size,"status":d.status,"created_at":d.created_at} for d in q.order_by(Document.id.desc()).all()]
@router.post("/upload")
async def upload(knowledge_base_id:int,file:UploadFile=File(...),db:Session=Depends(get_db)):
    if not validate_extension(file.filename): raise HTTPException(400,"Unsupported file type")
    kb=db.get(KnowledgeBase,knowledge_base_id)
    if not kb: raise HTTPException(404,"Knowledge base not found")
    content=await file.read()
    if not validate_file_size(len(content)): raise HTTPException(400,"File is empty or exceeds the upload limit")
    safe=generate_safe_filename(file.filename); path=settings.__class__ and Path(__import__('app.core.config',fromlist=['UPLOAD_DIR']).UPLOAD_DIR)/safe
    path.write_bytes(content); h=calculate_file_hash(path)
    if db.query(Document).filter(Document.knowledge_base_id==knowledge_base_id,Document.file_hash==h).first(): path.unlink(missing_ok=True); raise HTTPException(409,"Duplicate document")
    d=Document(knowledge_base_id=knowledge_base_id,filename=file.filename,stored_filename=safe,file_hash=h,mime_type=file.content_type,size=len(content),status="UPLOADED"); db.add(d); db.commit(); db.refresh(d)
    try: count=process_document(db,d)
    except Exception as e: d.status="FAILED"; db.commit(); raise HTTPException(500,f"Document processing failed: {e}")
    return {"id":d.id,"filename":d.filename,"status":d.status,"chunks":count}
@router.post("/{doc_id}/reindex")
def reindex(doc_id:int,db:Session=Depends(get_db)):
    d=db.get(Document,doc_id)
    if not d: raise HTTPException(404,"Document not found")
    try: count=process_document(db,d); return {"id":d.id,"status":d.status,"chunks":count}
    except Exception as e: d.status="FAILED"; db.commit(); raise HTTPException(500,f"Re-index failed: {e}")
@router.delete("/{doc_id}")
def delete_document(doc_id:int,db:Session=Depends(get_db)):
    d=db.get(Document,doc_id)
    if not d: raise HTTPException(404,"Document not found")
    p=Path(__import__('app.core.config',fromlist=['UPLOAD_DIR']).UPLOAD_DIR)/d.stored_filename
    db.query(Chunk).filter(Chunk.document_id==d.id).delete(); db.delete(d); db.commit(); p.unlink(missing_ok=True); return {"deleted":True}

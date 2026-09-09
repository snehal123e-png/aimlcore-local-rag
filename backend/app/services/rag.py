import time
from pathlib import Path
from app.core.config import settings
from app.services.ingestion.extractors import extract_file
from app.services.chunking.chunker import chunk_sections
from app.services.embeddings.embedder import get_embedder
from app.services.retrieval.faiss_store import save_index,search
from app.services.generation.ollama import generate
from app.models.db import Document,Chunk

def process_document(db,doc):
    doc.status="EXTRACTING"; db.commit()
    path=Path(settings.__class__.__module__) if False else Path(__import__('app.core.config',fromlist=['UPLOAD_DIR']).UPLOAD_DIR)/doc.stored_filename
    sections=extract_file(path)
    if not any(s.get("text","").strip() for s in sections): raise ValueError("No readable text found in document")
    doc.status="CHUNKING"; db.commit()
    chunks=chunk_sections(sections,settings.chunk_size,settings.chunk_overlap)
    db.query(Chunk).filter(Chunk.document_id==doc.id).delete()
    for i,c in enumerate(chunks): db.add(Chunk(document_id=doc.id,chunk_index=i,text=c["text"],page=c.get("page"),section=c.get("section"),token_count=c["token_count"]))
    db.commit(); doc.status="EMBEDDING"; db.commit()
    vectors=get_embedder().encode([c["text"] for c in chunks])
    meta=[]
    for i,c in enumerate(chunks): meta.append({"chunk_id":i,"document_id":doc.id,"filename":doc.filename,"page":c.get("page"),"section":c.get("section"),"text":c["text"]})
    # Rebuild complete KB index from all chunks
    all_chunks=db.query(Chunk).join(Document).filter(Document.knowledge_base_id==doc.knowledge_base_id).all()
    all_vectors=get_embedder().encode([c.text for c in all_chunks])
    all_meta=[]
    for c in all_chunks:
        d=db.get(Document,c.document_id); all_meta.append({"chunk_id":c.id,"document_id":d.id,"filename":d.filename,"page":c.page,"section":c.section,"text":c.text})
    save_index(doc.knowledge_base_id,all_vectors,all_meta)
    doc.status="INDEXED"; db.commit(); return len(chunks)

def answer(db,kb_id,question):
    start=time.perf_counter(); qv=get_embedder().encode([question]); results=search(kb_id,qv,settings.top_k); results=[r for r in results if r["similarity"]>=settings.relevance_threshold]
    retrieval_ms=(time.perf_counter()-start)*1000
    if not results: return {"answer":"I could not find enough information in the uploaded knowledge base.","sources":[],"retrieval_ms":retrieval_ms,"generation_ms":0}
    gs=time.perf_counter(); text=generate(question,results); generation_ms=(time.perf_counter()-gs)*1000
    return {"answer":text,"sources":results,"retrieval_ms":retrieval_ms,"generation_ms":generation_ms}

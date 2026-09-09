from pathlib import Path
import json, faiss, numpy as np
from app.core.config import INDEX_DIR

def index_paths(kb_id): return INDEX_DIR/f"kb_{kb_id}.index", INDEX_DIR/f"kb_{kb_id}.json"
def save_index(kb_id, vectors, metadata):
    index=faiss.IndexFlatIP(vectors.shape[1]); index.add(vectors); ip,mp=index_paths(kb_id); faiss.write_index(index,str(ip)); mp.write_text(json.dumps(metadata,ensure_ascii=False),encoding="utf-8")
def load_index(kb_id):
    ip,mp=index_paths(kb_id)
    if not ip.exists() or not mp.exists(): return None,None
    return faiss.read_index(str(ip)),json.loads(mp.read_text(encoding="utf-8"))
def search(kb_id, query_vector, k=5):
    index,meta=load_index(kb_id)
    if index is None: return []
    scores,ids=index.search(query_vector,k); return [{**meta[int(i)],"similarity":float(s),"rank":r+1} for r,(s,i) in enumerate(zip(scores[0],ids[0])) if i>=0]

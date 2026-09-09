import requests
from app.core.config import settings

def generate(question, sources):
    context="\n\n".join(f"[Source {i+1}] {s['filename']} | Page: {s.get('page') or 'N/A'} | Chunk: {s['chunk_id']}\n{s['text']}" for i,s in enumerate(sources))
    prompt=f'''You are AIMLCore Local Knowledge Assistant. Answer using only the provided context. Do not invent facts. If the context is insufficient, say exactly: "I could not find enough information in the uploaded knowledge base." Cite source document and page/chunk for factual claims.\n\nCONTEXT:\n{context}\n\nQUESTION:\n{question}'''
    r=requests.post(f"{settings.ollama_base_url}/api/generate",json={"model":settings.llm_model,"prompt":prompt,"stream":False},timeout=180)
    r.raise_for_status(); return r.json().get("response","")

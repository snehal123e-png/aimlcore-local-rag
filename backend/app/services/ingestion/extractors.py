from pathlib import Path
import fitz, pandas as pd
from docx import Document as DocxDocument

def extract_file(path):
    ext=Path(path).suffix.lower()
    if ext==".pdf":
        doc=fitz.open(path); out=[]
        for i,p in enumerate(doc): out.append({"text":p.get_text("text"),"page":i+1,"section":None})
        return out
    if ext==".docx":
        doc=DocxDocument(path); out=[]; section=None
        for para in doc.paragraphs:
            t=para.text.strip()
            if not t: continue
            if para.style and "heading" in para.style.name.lower(): section=t
            out.append({"text":t,"page":None,"section":section})
        return out
    if ext in {".txt",".md"}: return [{"text":Path(path).read_text(encoding="utf-8",errors="ignore"),"page":None,"section":None}]
    if ext==".csv":
        df=pd.read_csv(path).fillna(""); return [{"text":" | ".join(f"{c}: {row[c]}" for c in df.columns),"page":None,"section":"CSV row"} for _,row in df.iterrows()]
    raise ValueError("Unsupported file type")

import re

def words(text): return re.findall(r"\S+", text)
def chunk_sections(sections, chunk_size=600, overlap=100):
    if overlap>=chunk_size: raise ValueError("overlap must be smaller than chunk_size")
    chunks=[]; buffer=[]; meta=None
    for sec in sections:
        ws=words(sec["text"])
        i=0
        while i<len(ws):
            part=ws[i:i+chunk_size]
            if part:
                chunks.append({"text":" ".join(part),"page":sec.get("page"),"section":sec.get("section"),"token_count":len(part)})
            i += chunk_size-overlap
    return chunks

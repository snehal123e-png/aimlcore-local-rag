from sentence_transformers import SentenceTransformer
import numpy as np
from app.core.config import settings
class Embedder:
    def __init__(self): self.model=SentenceTransformer(settings.embedding_model)
    def encode(self,texts): return np.asarray(self.model.encode(texts,normalize_embeddings=True),dtype="float32")
_embedder=None
def get_embedder():
    global _embedder
    if _embedder is None: _embedder=Embedder()
    return _embedder

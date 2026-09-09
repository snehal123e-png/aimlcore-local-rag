# Architecture

User -> React/Vite -> FastAPI -> Ingestion/Chunking -> Local Embeddings -> FAISS -> Retrieval -> Ollama -> Grounded answer + source evidence.

The MVP keeps documents and vector indexes local. No OpenAI API is required.

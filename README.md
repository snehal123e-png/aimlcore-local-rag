# AIMLCore Local AI / RAG Knowledge Assistant

Production-style local Retrieval-Augmented Generation foundation using FastAPI, React/Vite, Sentence Transformers, FAISS and Ollama.

## Core flow
Documents -> extraction -> chunking -> embeddings -> FAISS -> retrieval -> Ollama -> grounded answer + source evidence.

## Requirements
- Python 3.12+
- Node.js 20+
- Ollama installed locally
- A local instruct model and embedding model downloaded before offline demo

## Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env  # Windows
# cp .env.example .env  # Linux/macOS
uvicorn app.main:app --reload
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and backend docs at http://localhost:8000/docs.

## Ollama
Start Ollama and configure `LLM_MODEL` and `OLLAMA_BASE_URL` in `.env`. The default embedding implementation uses Sentence Transformers and therefore needs the model available locally before an offline demo.

## Tests
```bash
cd backend
pytest -v
```

## Evaluation
Use at least 50 questions covering factual, multi-document, paraphrased, no-answer, ambiguous and adversarial cases. See `evaluation/`.

## Privacy
The core workflow is designed for local processing. Uploaded files are kept outside the frontend static directory and are not sent to an external inference API by this implementation.

## Limitations
Authentication is a local MVP placeholder; production deployment should add password hashing, JWT/session management, authorization and multi-tenant controls. OCR, hybrid retrieval and reranking are future enhancements.

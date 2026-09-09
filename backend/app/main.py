from fastapi import FastAPI,Request
from fastapi.responses import JSONResponse
from app.core.logging_config import setup_logging
from app.models.db import init_db
from app.api import auth,health,knowledge_bases,documents,chat,search
setup_logging(); init_db()
app=FastAPI(title="AIMLCore Local Knowledge Assistant",version="1.0.0")
for r in (auth.router,health.router,knowledge_bases.router,documents.router,chat.router,search.router): app.include_router(r)
@app.exception_handler(Exception)
async def global_exception_handler(request:Request,exc:Exception): return JSONResponse(status_code=500,content={"success":False,"error":"Internal server error"})
@app.get("/")
def root(): return {"name":"AIMLCore Local Knowledge Assistant","status":"running"}

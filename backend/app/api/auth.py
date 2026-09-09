from fastapi import APIRouter
from pydantic import BaseModel
router=APIRouter(prefix="/api/auth",tags=["Auth"])
class Login(BaseModel): username:str; password:str
@router.post("/login")
def login(body:Login): return {"success":True,"user":{"username":body.username},"message":"MVP local authentication placeholder"}
@router.post("/logout")
def logout(): return {"success":True}

from pydantic import BaseModel
class KnowledgeBaseCreate(BaseModel): name:str; description:str=""
class KnowledgeBaseOut(BaseModel): id:int; name:str; description:str
class ChatRequest(BaseModel): knowledge_base_id:int; question:str; conversation_id:int|None=None

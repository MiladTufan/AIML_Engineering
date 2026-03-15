from pydantic import BaseModel


class DeleteRequest(BaseModel):
    fileName: str


class AddModelRequest(BaseModel):
    modelName: str

class ChatElement(BaseModel):
    sender: str
    text: str

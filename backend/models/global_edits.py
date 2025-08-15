from pydantic import BaseModel, Field
from typing import List


class BoxDimensions(BaseModel):
    top: float
    left: float
    width: float
    height: float
    resizedHeight: float
    resizedWidth: float
    currentScale: float
    posCreationScale: float
    sizeCreationScale: float

class TextStyleEditor(BaseModel):
    isCollapsed: bool
    currentColor: str
    baseFontSize: float
    font_size: float
    fontFamily: str
    fontname: str

class TextBox(BaseModel):
    id: int
    pageId: int
    BoxDims: BoxDimensions
    text: str
    textStyleEditorState: TextStyleEditor

    baseTop: float = 0
    baseLeft: float = 0
    baseWidth: float = 0
    baseHeight: float = 0

class MiniPage(BaseModel):
    id: int
    textboxes: List[TextBox] =  Field(default_factory=List)

class GlobalEdit(BaseModel):
    pageEdits: List[MiniPage] =  Field(default_factory=List)  # safest approach
    deletedPages: List[int] = Field(default_factory=List)  # safest approach

class Payload(BaseModel):
    edits: GlobalEdit
    signed_id: str



dims = BoxDimensions(top=0, left=0, width=0, height=0, resizedHeight=0, 
                     resizedWidth=0, currentScale=0, posCreationScale=0, sizeCreationScale=0)

style = TextStyleEditor(isCollapsed=False, currentColor="black", baseFontSize=12.0, 
                        font_size=12.0, fontFamily="Helvetica", fontname="Helvetica")

t = TextBox(id=0, pageId=0, BoxDims=dims, text="INIT", textStyleEditorState=style, 
            baseTop=0, baseLeft=0, baseWidth=0, baseHeight=0)

mini = MiniPage(id=0, textboxes=[t])
edit = GlobalEdit(pageEdits=[mini], deletedPages=[1, 2, 3])

init_payload = Payload(edits=edit, signed_id="INIT")
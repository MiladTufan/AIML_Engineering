from pydantic import BaseModel, Field
from typing import List

class TextFormat(BaseModel):
    floatisBold: bool = False
    floatisItalic: bool = False
    floatisUnderline: bool = False
    floatisSuperscript: bool = False
    floatisSubscript: bool = False
    floatisLeftAlign: bool = False
    floatisRightAlign: bool = False
    floatisCenterAlign: bool = False


class TextStyle(BaseModel):
    isCollapsed: bool = False
    textFormat: TextFormat = TextFormat()
    textStyle: str = "Paragraph"
    textFontFamily: str = "Inter"
    textFontName: str = "Inter"
    textFontSize: float = 11
    textBaseFontSize: float = 11
    textColor: str = "black"
    textBG: str = "black"
    
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

class BlockObject(BaseModel):
    baseTop: float = 0.0
    baseLeft: float = 0.0
    baseWidth: float = 0.0
    baseHeight: float = 0.0
    id: int
    pageId: int
    BoxDims: BoxDimensions
    
    model_config = {
        "extra": "allow" 
    }
    
class TextBox(BlockObject):
    text: str
    TextStyleState: TextStyle
    
class MiniPage(BaseModel):
    id: int
    textboxes: List[BlockObject] =  Field(default_factory=List)

class GlobalEdit(BaseModel):
    pageEdits: List[MiniPage] =  Field(default_factory=List)  # safest approach
    deletedPages: List[int] = Field(default_factory=List)  # safest approach

class Payload(BaseModel):
    edits: GlobalEdit
    signed_id: str

# ===========================================================================
def cast_textbox_to_blockobject(t: TextBox):
    return BlockObject.model_validate(t.model_dump())


def cast_blockobject_to_textbox(b: BlockObject):
    return TextBox.model_validate(b.model_dump())


dims = BoxDimensions(top=0, left=0, width=0, height=0, resizedHeight=0, 
                     resizedWidth=0, currentScale=0, posCreationScale=0, sizeCreationScale=0)

t = TextBox(id=0, pageId=0, BoxDims=dims, text="INIT", TextStyleState=TextStyle(), 
            baseTop=0, baseLeft=0, baseWidth=0, baseHeight=0)

mini = MiniPage(id=0, textboxes=[cast_textbox_to_blockobject(t)])
edit = GlobalEdit(pageEdits=[mini], deletedPages=[1, 2, 3])

init_payload = Payload(edits=edit, signed_id="INIT")
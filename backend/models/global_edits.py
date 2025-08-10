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

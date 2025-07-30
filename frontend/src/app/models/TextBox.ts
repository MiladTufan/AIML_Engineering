import { TextStyleEditor } from "./TextStyleEditor";


export class TextBox {
    constructor(public id: number, public pageId:number, public top: number, 
                public left: number, public text: string,
                public textStyleEditorState: TextStyleEditor) {}
}

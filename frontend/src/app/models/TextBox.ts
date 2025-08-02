import { TextStyleEditor } from "./TextStyleEditor";


export class TextBox {
    constructor(public id: number, public pageId:number, public top: number, 
                public left: number, public width: number, public height: number, public text: string, 
                public textStyleEditorState: TextStyleEditor) {}
}

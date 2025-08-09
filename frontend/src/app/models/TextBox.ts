import { TextStyleEditor } from "./TextStyleEditor";


export class TextBox {
    public baseTop: number = 0;
    public baseLeft: number = 0;
    public baseWidth: number = 0;
    public baseHeight: number = 0;

    constructor(public id: number, public pageId: number, public BoxDims: BoxDimensions, public text: string,
        public textStyleEditorState: TextStyleEditor) { }



        // public top: number, public currentScale: number = 1.0,
        // public left: number, public width: number, public height: number,
}

export type BoxDimensions = {
  top: number;
  left: number;
  width: number;
  height: number;
  resizedHeight: number;
  resizedWidth: number;
  currentScale: number;
  posCreationScale: number;
  sizeCreationScale: number;
};
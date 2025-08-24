import { BlockObject } from "./BlockObject";
import { TextStyle } from "./TextStyle";



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


export class TextBox  extends BlockObject
{
  constructor(id: number, pageId: number, BoxDims: BoxDimensions, public text: string,
        public TextStyleState: TextStyle) { 
          super(id, pageId, BoxDims)
        }
}
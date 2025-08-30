import { BlockObject } from "./BlockObject";
import { ImgStyle, TextStyle } from "./TextStyle";



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


export class ImgBox extends BlockObject {
  constructor(id: number, pageId: number, BoxDims: BoxDimensions, public src: string, public StyleState: ImgStyle) {
    super(id, pageId, BoxDims)
  }
}
import { BlockObject } from './BlockObject';
import { TextStyle } from './TextStyle';

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

export class TextBlock {
  constructor(
    public text: string = 'Text',
    public startOffset: number = 0,
    public endOffset: number = 0,
    public StyleState: TextStyle = new TextStyle(),
  ) {}
}

export class TextBox extends BlockObject {
  constructor(
    id: number,
    pageId: number,
    BoxDims: BoxDimensions,
    public text: string,
    public textBlocks: Map<string, TextBlock>,
    public StyleState: TextStyle,
  ) {
    super(id, pageId, BoxDims);
  }
}

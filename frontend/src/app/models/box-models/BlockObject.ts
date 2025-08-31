export class BlockObject {
    public baseTop: number = 0;
    public baseLeft: number = 0;
    public baseWidth: number = 0;
    public baseHeight: number = 0;

    constructor(public id: number, public pageId: number, public BoxDims: BoxDimensions) { }
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
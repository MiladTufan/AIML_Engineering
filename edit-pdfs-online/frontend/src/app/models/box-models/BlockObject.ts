export class BlockObject {
  public baseTop: number = 0;
  public baseLeft: number = 0;
  public baseWidth: number = 0;
  public baseHeight: number = 0;

  constructor(public id: number, public pageId: number, public BoxDims: BoxDimensions) { }


  public deepCopyBlockObj(obj: BlockObject) {
    this.baseTop = obj.baseTop;
    this.baseLeft = obj.baseLeft;
    if (obj.BoxDims.resizedWidth === 0 && obj.BoxDims.resizedHeight === 0) {
      this.baseHeight = obj.baseHeight;
      this.baseWidth = obj.baseWidth;
    }
    else {
      this.baseHeight = obj.BoxDims.resizedHeight;
      this.baseWidth = obj.BoxDims.resizedWidth;
    }

    this.id = obj.id
  }
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
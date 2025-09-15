import { BlockObject } from './box-models/BlockObject';
import { TextBox } from './box-models/TextBox';

export class Page {
  private _pageNum: number = 0;
  private _updatePageNum: number = 0;
  private _isDeleted: Boolean = false;
  private _viewport: any;
  private _blockObjects: BlockObject[] = [];
  private _height: number = 0;
  private _width: number = 0;
  private _rotation: number = 0;
  private _htmlContainer: any;
  private _htmlContainerPreview: any;
  private _currentScale: number = 1.0;
  private _translateX: number = 1.0;
  private _translateY: number = 1.0;

  constructor(
    pageNum: number = 0,
    viewport: any = null,
    textboxes: any[] = [],
    blockObjects: any[] = [],
    height: number = 0,
    width: number = 0,
    rotation: number = 0,
    htmlContainer: any,
    htmlContainerPreview: any,
    translateX: number = 0,
    translateY: number = 0,
    currentScale: number = 0,
  ) {
    this._pageNum = pageNum;
    this._viewport = viewport;
    this._height = height;
    this._width = width;
    this._rotation = rotation;
    this._htmlContainer = htmlContainer;
    this._htmlContainerPreview = htmlContainerPreview;
    this._currentScale = currentScale;
    this._translateX = translateX;
    this._translateY = translateY;
    this._translateY = translateY;
    this._blockObjects = blockObjects;
    this._updatePageNum = pageNum;
  }

  get originalPageNum(): number {
    return this._pageNum;
  }
  get pageNum(): number {
    if (this._pageNum != this._updatePageNum) return this._updatePageNum;
    return this._pageNum;
  }
  set pageNum(value: number) {
    this._pageNum = value;
  }

  get updatePageNum(): number {
    return this._updatePageNum;
  }
  set updatePageNum(value: number) {
    this._updatePageNum = value;
  }

  get viewport(): any {
    return this._viewport;
  }
  set viewport(value: any) {
    this._viewport = value;
  }

  get blockObjects(): any[] {
    return this._blockObjects;
  }
  set blockObjects(value: any[]) {
    this._blockObjects = value;
  }

  get isDeleted(): Boolean {
    return this._isDeleted;
  }
  set isDeleted(value: Boolean) {
    this._isDeleted = value;
  }

  get height(): number {
    return this._height;
  }
  set height(value: number) {
    this._height = value;
  }

  get width(): number {
    return this._width;
  }
  set width(value: number) {
    this._width = value;
  }

  get rotation(): number {
    return this._rotation;
  }
  set rotation(value: number) {
    this._rotation = value;
  }

  get htmlContainer(): any {
    return this._htmlContainer;
  }
  set htmlContainer(value: any) {
    this._htmlContainer = value;
  }

  get htmlContainerPreview(): any {
    return this._htmlContainerPreview;
  }
  set htmlContainerPreview(value: any) {
    this._htmlContainerPreview = value;
  }

  get currentScale(): any {
    return this._currentScale;
  }
  set currentScale(value: any) {
    this._currentScale = value;
  }

  get translateX(): any {
    return this._translateX;
  }
  set translateX(value: any) {
    this._translateX = value;
  }

  get translateY(): any {
    return this._translateY;
  }
  set translateY(value: any) {
    this._translateY = value;
  }

  addBlockObject(newObj: BlockObject) {
    this.blockObjects.push(newObj);
  }

  replaceBlockObject(obj: BlockObject, idx: number) {
    this.blockObjects.splice(idx, 1, obj);
  }

  removeBlockObject(objToRemove: BlockObject) {
    const index = this.blockObjects.indexOf(objToRemove);
    if (index > -1) {
      this.blockObjects.splice(index, 1);
    }
  }
}

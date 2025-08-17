
import { TextBox } from "./TextBox";

export class Page {
    private _pageNum: number = 0;
    private _viewport: any;
    private _textboxes: TextBox[] = [];
    private _height: number = 0;
    private _width: number = 0;
    private _rotation: number = 0;
    private _htmlContainer: any
    private _currentScale: number = 1.0
    private _translateX: number = 1.0
    private _translateY: number = 1.0

    constructor(
        pageNum: number = 0,
        viewport: any = null,
        textboxes: any[] = [],
        height: number = 0,
        width: number = 0,
        rotation: number = 0,
        htmlContainer: any,
        translateX: number = 0,
        translateY: number = 0,
        currentScale: number = 0,
    ) {
        this._pageNum = pageNum;
        this._viewport = viewport;
        this._textboxes = textboxes;
        this._height = height;
        this._width = width;
        this._rotation = rotation;
        this._htmlContainer = htmlContainer;
        this._currentScale = currentScale;
        this._translateX = translateX;
        this._translateY = translateY;
    }

    get pageNum(): number { return this._pageNum; }
    set pageNum(value: number) { this._pageNum = value; }

    get viewport(): any { return this._viewport; }
    set viewport(value: any) { this._viewport = value; }

    get textboxes(): any[] { return this._textboxes; }
    set textboxes(value: any[]) { this._textboxes = value; }

    get height(): number { return this._height; }
    set height(value: number) { this._height = value; }

    get width(): number { return this._width; }
    set width(value: number) { this._width = value; }

    get rotation(): number { return this._rotation; }
    set rotation(value: number) { this._rotation = value; }

    get htmlContainer(): any { return this._htmlContainer; }
    set htmlContainer(value: any) { this._htmlContainer = value; }

    get currentScale(): any { return this._currentScale; }
    set currentScale(value: any) { this._currentScale = value; }


    get translateX(): any { return this._translateX; }
    set translateX(value: any) { this._translateX = value; }

    get translateY(): any { return this._translateY; }
    set translateY(value: any) { this._translateY = value; }

    appendTextBox(textBox: TextBox) {
        this.textboxes.push(textBox)
    }

    replaceTextBox(nexTextBox: TextBox, idx: number) {
        this.textboxes.splice(idx, 1, nexTextBox);
    }

    removeTextBox(textBoxToRemove: TextBox) {
        const index = this.textboxes.indexOf(textBoxToRemove);
        if (index > -1) {
            this.textboxes.splice(index, 1);
        }
    }
}
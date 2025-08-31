


export class TextStyle {
    public isCollapsed: Boolean = true;
    public textFormat: TextFormat = new TextFormat()
    public textStyle: string = "Paragraph"
    public textFontFamily: string = "Inter"
    public textFontName: string = "Inter"
    public textFontSize: number = 11
    public textBaseFontSize: number = 11;
    public textColor: String = "black";
    public textBG: String = "black";

}

export class TextFormat
{
    public isBold: Boolean = false;
    public isItalic: Boolean = false;
    public isUnderline: Boolean = false;
    public isSuperscript: Boolean = false;
    public isSubscript: Boolean = false;
    public isLeftAlign: Boolean = false;
    public isRightAlign: Boolean = false;
    public isCenterAlign: Boolean = false;
}

export class ImgStyle {
    public isCollapsed: Boolean = true;
}
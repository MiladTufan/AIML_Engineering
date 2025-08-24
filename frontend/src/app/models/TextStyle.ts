


export class TextStyle {
    public isCollapsed: Boolean = true;
    public textAlign: string = "left" // either left, center, or right
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
    public bold: Boolean = false;
    public italic: Boolean = false;
    public underline: Boolean = false;
    public superscript: Boolean = false;
    public subscript: Boolean = false;
}
import { Component, Input, SimpleChanges } from '@angular/core';
import { DropDownMenuComponent } from '../drop-down-menu-component/drop-down-menu-component';
import { TextEditService } from '../../../services/text-edit-service';
import { PDFViewerService } from '../../../services/pdfviewer-service';
import { CommonModule } from '@angular/common';
import { SlideInOutToolbarExtension } from '../../../animations/animations';
import { TextBox } from '../../../models/TextBox';

@Component({
  selector: 'app-text-style-block',
  imports: [DropDownMenuComponent, CommonModule],
  templateUrl: './text-style-block.html',
  styleUrl: './text-style-block.css',
  animations: [SlideInOutToolbarExtension]
})
export class TextStyleBlock {

  @Input() translateX: number = 0;
  @Input() translateY: number = 0;
  @Input() box: any;

  isCollapsed: Boolean = true;
  isFontDropDownOpen: Boolean = false;
  isStyleDropDownOpen: Boolean = false;
  isSizeDropDownOpen: Boolean = false;

  public isFontBold: Boolean = false;
  public isFontItalic: Boolean = false;
  public isFontUnderline: Boolean = false;
  public isFontSuperscript: Boolean = false;
  public isFontSubScript: Boolean = false;

  public isLeftAlign: Boolean = false;
  public isCenterAlign: Boolean = false;
  public isRightAlign: Boolean = false;
  public isLink: Boolean = false;

  currentFont: string = "Inter, sans-serif";
  currentFontName: string = "Inter";
  currentFontSize: string = "11"
  currentFontStyle: string = "Paragraph"

  private globalTextbox: TextBox | null = null

  constructor(public textEditService: TextEditService, public pdfViewerService: PDFViewerService) {

  }

  colors: string[] = [
    '#000000', '#FFFFFF', '#8B0000', '#800000', '#8B4513', '#FF8C00',
    '#DAA520', '#808000', '#228B22', '#008080', '#4682B4',
    '#4169E1', '#4B0082', '#9400D3', '#BA55D3', '#DDA0DD',
    '#708090', '#778899', '#D3D3D3', '#DCDCDC',
  ];

  firstRowStyle: string[] = ['#FFFFFF', '#000000', '#F08080'];
  scndRowStyle: string[] = ['#7DA7F2', '#7BC67E', '#F7D35E'];
  firstRowBg: string[] = ['#FFFFFF', '#CFC7A6', '#C5C3E3'];
  scndRowBg: string[] = ['#D5F7B2', '#C0C0C0', '#D1F0F5'];


  fontOptions = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open-Sans', value: '"Open Sans", sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Nunito', value: 'Nunito, sans-serif' },
    { name: 'Ubuntu', value: 'Ubuntu, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Courier New', value: '"Courier New", monospace' },
    { name: 'Comic Sans', value: '"Comic Sans MS", cursive, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
    { name: 'Tahoma', value: 'Tahoma, sans-serif' },
    { name: 'Times New Roman', value: '"Times New Roman", serif' },
    { name: 'Lucida Console', value: '"Lucida Console", monospace' }
  ];

  styleOptions = [
    {style: "Paragraph", value: "p"},
    {style: "Heading H1", value: "h1"},
    {style: "Heading H2", value: "h2"},
    {style: "Heading H3", value: "h3"}
  ]

  fontSizeSteps = ["8", "10", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "60", "72", "108"];
  availableFonts: string[] = ["Inter", "Roboto", "Open-Sans", "Lato", "Poppins", "Montserrat", "Nunito",
    "Ubuntu", "Georgia", "Courier New", "Comic Sans", "Arial", "Verdana",
    "Trebuchet MS", "Tahoma", "Times New Roman", "Lucida Console"];

  availableStyles: string[] = ["Paragraph", "Heading H1", "Heading H2", "Heading H3"]

  ngOnChanges(changes: SimpleChanges) {
    if (changes['box']) {
      const box = this.textEditService.textboxes.find(b => b.id === changes['box'].currentValue.id)
      if(box)
        this.globalTextbox = box
      else
        console.error("There is no associated TextBox for TextStyle!")
    }
  }

  onColorSelect(color: string) {
    this.globalTextbox!.TextStyleState.textColor = color;
  }

  onBgColorSelect(bgColor: string) {
    throw new Error('Method not implemented.');
  }

  SelectedFont(fontName: string, toggleDropDown: boolean = true) {
    this.currentFontName = fontName
    if (toggleDropDown)
      this.isFontDropDownOpen = !this.isFontDropDownOpen;
    const fontFamily = this.fontOptions.find(f => f.name == fontName)?.value
    this.currentFont = fontFamily!;
    this.globalTextbox!.TextStyleState.textFontFamily = fontFamily!
    this.globalTextbox!.TextStyleState.textFontName = fontName
  }

  //=========================================================================================================
  // When A user selects/types a fontsize in the dropdown menu of the TextStyleBar then this is handled here.
  // @param fontSize: string => the selected or typed fontsize.
  //=========================================================================================================
  SelectedFontSize(fontSize: string, toggleDropDown: Boolean = true) {
    try {
      const fontSizeNumeric = Number(fontSize)
      this.currentFontSize = fontSize;
      if (toggleDropDown)
        this.isSizeDropDownOpen = !this.isSizeDropDownOpen
      this.globalTextbox!.TextStyleState.textFontSize = fontSizeNumeric * this.pdfViewerService.currentScale

      this.globalTextbox!.TextStyleState.textBaseFontSize = fontSizeNumeric
    }
    catch {
      console.log("Invalid Fontsize");
    }
  }

  stripHtmlTags(text: string) {
    return text.replace(/<[^>]*>/g, '');
  }

  //=========================================================================================================
  // When A user selects/types a fontsize in the dropdown menu of the TextStyleBar then this is handled here.
  // @param fontSize: string => the selected or typed fontsize.
  //=========================================================================================================
  SelectedStyle(style: string, toggleDropDown: Boolean = true) {
      if (toggleDropDown)
        this.isStyleDropDownOpen = !this.isStyleDropDownOpen

      const currType = this.styleOptions.find(s => s.style === style)
      if (currType)
      {
        this.globalTextbox!.text = this.stripHtmlTags(this.box.text)
        this.globalTextbox!.text = `<${currType.value}>${this.box.text}</${currType.value}>`;
        this.globalTextbox!.TextStyleState.textStyle = currType.style
      }
  }

  //=============================================================================================================
  // Text Align
  //=============================================================================================================
  textAlignLeft($event: MouseEvent) {
    this.isLeftAlign = !this.isLeftAlign;
    this.globalTextbox!.TextStyleState.textFormat.isLeftAlign = this.isLeftAlign;

    if (this.isLeftAlign)
    {
      this.isRightAlign = false;
      this.isCenterAlign = false;
      this.globalTextbox!.TextStyleState.textFormat.isRightAlign = false;
      this.globalTextbox!.TextStyleState.textFormat.isCenterAlign = false;
    }
  }

  textAlignRight($event: MouseEvent) {
    this.isRightAlign = !this.isRightAlign;
    this.globalTextbox!.TextStyleState.textFormat.isRightAlign = this.isRightAlign;

    if (this.isRightAlign)
    {
      this.isLeftAlign = false;
      this.isCenterAlign = false;
      this.globalTextbox!.TextStyleState.textFormat.isLeftAlign = false;
      this.globalTextbox!.TextStyleState.textFormat.isCenterAlign = false;
    }
  }

  textAlignCenter($event: MouseEvent) {
    this.isCenterAlign = !this.isCenterAlign;
    this.globalTextbox!.TextStyleState.textFormat.isCenterAlign = this.isCenterAlign;

    if (this.isCenterAlign)
    {
      this.isLeftAlign = false;
      this.isRightAlign = false;
      this.globalTextbox!.TextStyleState.textFormat.isLeftAlign = false;
      this.globalTextbox!.TextStyleState.textFormat.isRightAlign = false;
    }
  }


  //=============================================================================================================
  // Text Format
  //=============================================================================================================
  textFormatSubscript() {
    this.isFontSubScript = !this.isFontSubScript;
    this.globalTextbox!.TextStyleState.textFormat.isSubscript = this.isFontSubScript;
  }

  textFormatSuperscript() {
    this.isFontSuperscript = !this.isFontSuperscript;
    this.globalTextbox!.TextStyleState.textFormat.isSuperscript = this.isFontSuperscript;
  }

  textFormatItalic() {
    this.isFontItalic = !this.isFontItalic;
    this.globalTextbox!.TextStyleState.textFormat.isItalic = this.isFontItalic;
  }

  textFormatBold() {
    this.isFontBold = !this.isFontBold;
    this.globalTextbox!.TextStyleState.textFormat.isBold = this.isFontBold;
  }

  textFormatUnderline() {
    this.isFontUnderline = !this.isFontUnderline;
    this.globalTextbox!.TextStyleState.textFormat.isUnderline = this.isFontUnderline;
  }
}

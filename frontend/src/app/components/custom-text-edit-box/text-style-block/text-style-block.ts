import { Component } from '@angular/core';
import { DropDownMenuComponent } from '../drop-down-menu-component/drop-down-menu-component';
import { TextEditService } from '../../../services/text-edit-service';
import { PDFViewerService } from '../../../services/pdfviewer-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-text-style-block',
  imports: [DropDownMenuComponent, CommonModule],
  templateUrl: './text-style-block.html',
  styleUrl: './text-style-block.css'
})
export class TextStyleBlock {
  isCollapsed: Boolean = true;
  isFontDropDownOpen: Boolean = false;
  isStyleDropDownOpen: Boolean = false;
  currentFont: string = "Inter, sans-serif";
  currentFontName: string = "Inter";
  currentFontSize: string = "11"

  constructor(private textEditService: TextEditService, private pdfViewerService: PDFViewerService) { }

  colors: string[] = [
    '#000000', '#FFFFFF', '#8B0000', '#800000', '#8B4513', '#FF8C00',
    '#DAA520', '#808000', '#228B22', '#008080', '#4682B4',
    '#4169E1', '#4B0082', '#9400D3', '#BA55D3', '#DDA0DD',
    '#708090', '#778899', '#D3D3D3', '#DCDCDC',
  ];

  firstRow: string[] = [
    '#FFFFFF',       // white
    'black',       // black
    '#D97783'     // reddish (soft/muted red)
  ];
  scndRow: string[] = [
    '#3B82F6',     // blue (not too strong, Tailwind-blue-500)
    '#10B981',     // green (not too strong, Tailwind-green-500)
    '#F59E0B'      // orange (Tailwind-orange-500)
  ]

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

  fontSizeSteps = ["8", "10", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "60", "72"];
  availableFonts: string[] = ["Inter", "Roboto", "Open-Sans", "Lato", "Poppins", "Montserrat", "Nunito",
    "Ubuntu", "Georgia", "Courier New", "Comic Sans", "Arial", "Verdana",
    "Trebuchet MS", "Tahoma", "Times New Roman", "Lucida Console"];

  availableStyles: string[] = ["Heading H1", "Heading H2", "Heading H3"]


  onColorSelect(color: string) {
    //this.textEditService.getCurrentTextStyleEditor().currentColor = color;
  }

  SelectedFont(fontName: string) {
    this.currentFontName = fontName
    this.isFontDropDownOpen = !this.isFontDropDownOpen;
    const fontFamily = this.fontOptions.find(f => f.name == fontName)?.value
    this.currentFont = fontFamily!;
    // this.textEditService.getCurrentTextBox().textStyleEditorState.fontFamily = fontFamily!
    // this.textEditService.getCurrentTextBox().textStyleEditorState.fontname = fontName
  }

  SelectedFontInput(fontName: string) {
    this.currentFontName = fontName
    // this.isFontDropDownOpen = !this.isFontDropDownOpen;
    const fontFamily = this.fontOptions.find(f => f.name == fontName)?.value
    this.currentFont = fontFamily!;
    // this.textEditService.getCurrentTextBox().textStyleEditorState.fontFamily = fontFamily!
    // this.textEditService.getCurrentTextBox().textStyleEditorState.fontname = fontName
  }
  //=========================================================================================================
  // When A user selects/types a fontsize in the dropdown menu of the TextStyleBar then this is handled here.
  // @param fontSize: string => the selected or typed fontsize.
  //=========================================================================================================
  SelectedFontSize(fontSize: string) {
    try {
      const fontSizeNumeric = Number(fontSize)
      this.currentFontSize = fontSize;
      this.isStyleDropDownOpen = !this.isStyleDropDownOpen
      // this.textEditService.getCurrentTextBox().textStyleEditorState.font_size = 
      // 										fontSizeNumeric * this.pdfViewerService.currentScale

      // this.textEditService.getCurrentTextBox().textStyleEditorState.baseFontSize = fontSizeNumeric
    }
    catch {
      console.log("Invalid Fontsize");
    }
  }

  //=========================================================================================================
  // When A user selects/types a fontsize in the dropdown menu of the TextStyleBar then this is handled here.
  // @param fontSize: string => the selected or typed fontsize.
  //=========================================================================================================
  SelectedStyleInput(style: string) {
    try {
      //this.isStyleDropDownOpen = !this.isStyleDropDownOpen
      // this.textEditService.getCurrentTextBox().textStyleEditorState.font_size = 
      // 										fontSizeNumeric * this.pdfViewerService.currentScale

      // this.textEditService.getCurrentTextBox().textStyleEditorState.baseFontSize = fontSizeNumeric
    }
    catch {
      console.log("Invalid Fontsize");
    }
  }

  SelectedStyle(style: string) {
    try {
      this.isStyleDropDownOpen = !this.isStyleDropDownOpen
      // this.textEditService.getCurrentTextBox().textStyleEditorState.font_size = 
      // 										fontSizeNumeric * this.pdfViewerService.currentScale

      // this.textEditService.getCurrentTextBox().textStyleEditorState.baseFontSize = fontSizeNumeric
    }
    catch {
      console.log("Invalid Fontsize");
    }
  }


}

import { Component, HostListener } from '@angular/core';
import { TextEditService } from '../../../services/text-edit-service';
import { CommonModule } from '@angular/common';
import { SlideInOutToolbarExtension } from '../../../animations/animations';
import { FormsModule } from '@angular/forms';
import { PDFViewerService } from '../../../services/pdfviewer-service';
import { DropDownMenuComponent } from '../drop-down-menu-component/drop-down-menu-component';

@Component({
	selector: 'app-text-style-bar',
	imports: [CommonModule, FormsModule, DropDownMenuComponent],
	templateUrl: './text-style-bar.html',
	styleUrl: './text-style-bar.css',
	animations: [SlideInOutToolbarExtension]
})
export class TextStyleBar {
	constructor(public textEditService: TextEditService, private pdfViewService: PDFViewerService) { }

	isCollapsed: Boolean = true;
	isFontDropDownOpen: Boolean = false;
	isFontSizeDropDownOpen: Boolean = false;
	currentFont: string = "Inter, sans-serif";
	currentFontName: string = "Inter";
	currentFontSize: string = "11"

	colors: string[] = [
		'#000000', '#8B0000', '#800000', '#8B4513', '#FF8C00',
		'#DAA520', '#808000', '#228B22', '#008080', '#4682B4',
		'#4169E1', '#4B0082', '#9400D3', '#BA55D3', '#DDA0DD',
		'#708090', '#778899', '#D3D3D3', '#DCDCDC', '#FFFFFF'
	];

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


	//=========================================================================================================
	// Available Font sizes and Fonts for the user to pick in a drop down menu.
	//=========================================================================================================
	fontSizeSteps = ["8", "10", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "60", "72"];
	availableFonts: string[] = ["Inter", "Roboto", "Open-Sans", "Lato", "Poppins", "Montserrat", "Nunito",
  								"Ubuntu", "Georgia", "Courier New", "Comic Sans", "Arial", "Verdana", 
								"Trebuchet MS", "Tahoma", "Times New Roman", "Lucida Console"];

	onColorSelect(color: string) {
		this.textEditService.getCurrentTextStyleEditor().currentColor = color;
	}

	expandColorPallet() {
		this.textEditService.getCurrentTextStyleEditor().isCollapsed = false;
	}

	collapseColorPallet() {
		this.textEditService.getCurrentTextStyleEditor().isCollapsed = true;
	}


	toggleFontDropDown() {
		this.isFontDropDownOpen = !this.isFontDropDownOpen;
	}

	toggleSizeDropDown() {
		this.isFontSizeDropDownOpen = !this.isFontSizeDropDownOpen;
	}



	SelectedFont(fontName: string) {
		this.currentFontName = fontName
		this.isFontDropDownOpen = !this.isFontDropDownOpen;
		const fontFamily = this.fontOptions.find(f => f.name == fontName)?.value
		this.currentFont = fontFamily!;
		this.textEditService.getCurrentTextBox().textStyleEditorState.fontFamily = fontFamily!
	}

	//=========================================================================================================
	// When A user selects/types a fontsize in the dropdown menu of the TextStyleBar then this is handled here.
	// @param fontSize: string => the selected or typed fontsize.
	//=========================================================================================================
	SelectedFontSize(fontSize: string) {
		try {
			const fontSizeNumeric = Number(fontSize)
			this.currentFontSize = fontSize;
			this.textEditService.getCurrentTextBox().textStyleEditorState.font_size = 
													fontSizeNumeric * this.pdfViewService.currentScale

			this.textEditService.getCurrentTextBox().textStyleEditorState.baseFontSize = 
													fontSizeNumeric * this.pdfViewService.currentScale
		}
		catch {
			console.log("Invalid Fontsize");
		}
	}

	_checkClick(id: string, target: HTMLElement) {
		let clickInsideFontSelect = false;
		let node = target
		clickInsideFontSelect = node?.id === id ? true : false;
		while (node.parentElement) {
			clickInsideFontSelect = node?.id === id ? true : false;
			if (clickInsideFontSelect) return true;
			node = node.parentElement
		}
		return clickInsideFontSelect;
	}

	@HostListener('document:click', ['$event'])
	onDocumentClick(event: MouseEvent) {

		try {
			const eventTarget = (event.target as HTMLElement)
			let clickInsideFontSelect = false;
			let clickInsideFontSizeSelect = false;

			clickInsideFontSelect = this._checkClick("fontSelect", eventTarget)
			clickInsideFontSizeSelect = this._checkClick("fontSizeSelect", eventTarget)

			if (this.isFontDropDownOpen && !clickInsideFontSelect)
				this.isFontDropDownOpen = false;

			if (this.isFontSizeDropDownOpen && !clickInsideFontSizeSelect)
				this.isFontSizeDropDownOpen = false;
		}
		catch {

		}

	}

}

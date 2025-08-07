import { Component } from '@angular/core';
import { TextEditService } from '../../../services/text-edit-service';
import { CommonModule } from '@angular/common';
import { SlideInOutToolbarExtension } from '../../../animations/animations';

@Component({
	selector: 'app-text-style-bar',
	imports: [CommonModule],
	templateUrl: './text-style-bar.html',
	styleUrl: './text-style-bar.css',
	animations: [SlideInOutToolbarExtension]
})
export class TextStyleBar {
	constructor(public textEditService: TextEditService) { }

	isCollapsed: Boolean = true;
	isFontDropDownOpen: Boolean = false;

	colors: string[] = [
		'#000000', '#8B0000', '#800000', '#8B4513', '#FF8C00',
		'#DAA520', '#808000', '#228B22', '#008080', '#4682B4',
		'#4169E1', '#4B0082', '#9400D3', '#BA55D3', '#DDA0DD',
		'#708090', '#778899', '#D3D3D3', '#DCDCDC', '#FFFFFF'
	];

	fontOptions = [
		{ name: 'Roboto', value: 'Roboto, sans-serif' },
		{ name: 'Georgia', value: 'Georgia, serif' },
		{ name: 'Courier New', value: '"Courier New", monospace' },
		{ name: 'Comic Sans', value: '"Comic Sans MS", cursive, sans-serif' },
		{ name: 'Arial', value: 'Arial, sans-serif' }
	];

	onColorSelect(color: string) {
		this.textEditService.getCurrentTextStyleEditor().currentColor = color;
	}

	expandColorPallet() {
		this.textEditService.getCurrentTextStyleEditor().isCollapsed = false;
	}

	collapseColorPallet() {
		this.textEditService.getCurrentTextStyleEditor().isCollapsed = true;
	}


	toggleDowpDown() {
		this.isFontDropDownOpen = !this.isFontDropDownOpen;
	}

}

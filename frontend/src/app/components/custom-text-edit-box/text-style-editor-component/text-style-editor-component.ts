import { Component, Output } from '@angular/core';
import { TextEditService } from '../../../services/text-edit-service';
import { EventEmitter } from 'stream';
import { CommonModule } from '@angular/common';
import { SlideInOutToolbarExtension } from '../../../animations/animations';

@Component({
	selector: 'app-text-style-editor-component',
	imports: [CommonModule],
	templateUrl: './text-style-editor-component.html',
	styleUrl: './text-style-editor-component.css',
	animations: [SlideInOutToolbarExtension]
})

export class TextStyleEditorComponent {
	constructor(public textEditService: TextEditService) { }

	isCollapsed: Boolean = true;

	colors: string[] = [
		'#000000', '#8B0000', '#800000', '#8B4513', '#FF8C00',
		'#DAA520', '#808000', '#228B22', '#008080', '#4682B4',
		'#4169E1', '#4B0082', '#9400D3', '#BA55D3', '#DDA0DD',
		'#708090', '#778899', '#D3D3D3', '#DCDCDC', '#FFFFFF'
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
}

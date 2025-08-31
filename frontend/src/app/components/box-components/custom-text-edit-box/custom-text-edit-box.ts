import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextStyleBlock } from '../../shared/text-style-block/text-style-block';
import { TextEditService } from '../../../services/box-services/text-edit-service';
import { EntityManagerService } from '../../../services/box-services/entity-manager-service';

@Component({
	selector: 'app-custom-text-edit-box',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './custom-text-edit-box.html',
	styleUrl: './custom-text-edit-box.css'
})
export class CustomTextEditBox {
	//=================================================== Private variables =================================================
	isDragging = false;
	id: number = 0;
	posX: number = 0;
	posY: number = 0;
	text: string = "Text";
	dragOffsetX = 0;
	dragOffsetY = 0;
	currentlyEditing = false;
	textColor: string = "black"
	mouseX: number = 0;
	mouseY: number = 0;
	cntr = 0;
	currentAlignment: string = "left"
	currentEventTarget: EventTarget | null = null;
	private resizeObserver!: ResizeObserver;

	//=================================================== Inputs =================================================
	@Input() box: any;

	//=================================================== Outputs =================================================
	@Output() textBoxEditClicked = new EventEmitter<Boolean>();
	@Output() positionChanged = new EventEmitter<{ top: number; left: number }>();

	//=================================================== Children =================================================
	@ViewChild('editableDiv') editableDiv!: ElementRef;
	@ViewChild(TextStyleBlock) textStyleBlockComponent!: TextStyleBlock


	constructor(public textEditService: TextEditService, private entityManagerService: EntityManagerService) { }
	ngOnInit() {
		console.log("init TextBoxComponent")
	}

	roundedWidth(w: number) {
		return Math.round(w);
	}

	onInput(event: Event) {
		const text = (event.target as HTMLElement).innerText;
		const savedBox = this.textEditService.textboxes.find(b => b.id == this.box.id);
		if (savedBox) {
			savedBox.text = text;
		}
	}

	expandColorPallet() {
		const currentTextStyle = this.textEditService.getCurrentTextStyle()
		// this.currentFontSize = currentTextStyle.textBaseFontSize.toString()
		// this.currentFont = currentTextStyle.textFontFamily
		// this.currentFontName = currentTextStyle.textFontName
		this.textEditService.getCurrentTextStyle().isCollapsed = false;
	}

	collapseColorPallet() {
		this.textEditService.getCurrentTextStyle().isCollapsed = true;
	}

	getTextAlignment() {
		if (this.box.StyleState.textFormat.isCenterAlign)
			return "center"
		else if (this.box.StyleState.textFormat.isRightAlign)
			return "right"
		else
			return "left"
	}

	styleText(elem: HTMLElement) {
		elem.style.textAlign = this.getTextAlignment();
		elem.style.color = this.box.StyleState.textColor;
		elem.style.fontSize = this.box.StyleState.textFontSize + "px";
		elem.style.fontWeight = this.box.StyleState.textFormat.isBold ? "bold" : "normal"
		elem.style.fontStyle = this.box.StyleState.textFormat.isItalic ? "italic" : "normal"
		elem.style.textDecoration = this.box.StyleState.textFormat.isUnderline ? "underline" : "normal"
		elem.style.fontFamily = this.box.StyleState.textFontFamily

		return elem
	}



	updateTextStyle() {

		const div = this.editableDiv.nativeElement;
		this.styleText(div)

		// const selection = window.getSelection();
		// if (!selection) return;

		// if (selection.isCollapsed) {
		// 	this.styleText(div)
		// 	return;
		// }

		// if (selection.rangeCount === 0) return;

		// const range = selection.getRangeAt(0);
		// if (!div.contains(range.commonAncestorContainer)) return;

		// const blocks = this.getTouchedBlocks(range, div);

		// blocks.forEach(block => {
		// 	this.styleText(block)
		// });

		// const span = document.createElement('span');
		// this.styleText(span)

		// span.appendChild(range.extractContents());
		// range.insertNode(span);

		// range.setStartAfter(span);
		// range.collapse(true);
		// selection.removeAllRanges();
		// selection.addRange(range);

		div.focus();
	}


	@HostListener('document:click', ['$event'])
	onDocumentClick(event: MouseEvent) {
		try {
			if (this.editableDiv == null) return;

			const clickedInsideTextBox = this.editableDiv.nativeElement.contains(event.target);
			const eventTarget = (event.target as HTMLElement)

			let clickInsideTextStyle = false;
			let node = eventTarget
			while (node.parentElement) {
				clickInsideTextStyle = node?.id === "TextStyleContainer" ? true : false;
				if (clickInsideTextStyle) break;
				node = node.parentElement
			}

			if (!clickInsideTextStyle) {
				this.currentlyEditing = clickedInsideTextBox;
				this.textBoxEditClicked.emit(this.currentlyEditing)
				console.log(this.currentlyEditing)
				console.log("current box.id: ", this.box.id)
			}
		}
		catch (error) {
			console.log(error)
		}
	}

	getTouchedBlocks(range: Range, root: HTMLElement): HTMLElement[] {
		const blocks: HTMLElement[] = [];
		const walker = document.createTreeWalker(
			root,
			NodeFilter.SHOW_ELEMENT,
			{
				acceptNode: (node) => {
					const el = node as HTMLElement;
					const style = window.getComputedStyle(el);
					if (style.display === 'block' && range.intersectsNode(el)) {
						return NodeFilter.FILTER_ACCEPT;
					}
					return NodeFilter.FILTER_SKIP;
				}
			}
		);

		let node = walker.nextNode();
		while (node) {
			blocks.push(node as HTMLElement);
			node = walker.nextNode();
		}

		// If no blocks found, fall back to the common ancestor
		if (blocks.length === 0) {
			let el = range.commonAncestorContainer as HTMLElement;
			while (el && el !== root && window.getComputedStyle(el).display !== 'block') {
				el = el.parentElement!;
			}
			if (el) blocks.push(el);
		}

		return blocks;
	}
}

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, HostListener } from '@angular/core';
import { TextEditService } from '../../services/text-edit-service';
import { CommonModule } from '@angular/common';
import { TextBox } from '../../models/TextBox';
import { PDFViewerService } from '../../services/pdfviewer-service';

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
	currentEventTarget: EventTarget | null = null;
	private resizeObserver!: ResizeObserver;

	//=================================================== Inputs =================================================
	@Input() box: any;

	//=================================================== Outputs =================================================
	@Output() textBoxEditClicked = new EventEmitter<Boolean>();
	@Output() positionChanged = new EventEmitter<{ top: number; left: number }>();

	//=================================================== Children =================================================
	@ViewChild('editableDiv') editableDiv!: ElementRef;


	constructor(public textEditService: TextEditService, private pdfViewerService: PDFViewerService) { }
	ngOnInit() {
		console.log("init TextBoxComponent")
		this.resizeObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				if (this.pdfViewerService.ignoreResizeTimeout) return;

				const { width, height } = entry.target.getBoundingClientRect();
				const box = this.textEditService.textboxes.find(b => b.id === this.box.id);

				if (box) {
					const page = this.pdfViewerService.getPageWithNumber(box.pageId)
					const rect2 = (page!.htmlContainer! as HTMLElement).getBoundingClientRect();
					box.BoxDims.resizedWidth = width
					box.BoxDims.resizedHeight = height
					const diff = Math.abs(box.BoxDims.left - rect2.width)

					if (width > diff) 
					{
						box.BoxDims.resizedWidth = diff
						box.BoxDims.width = diff
					}
					box.BoxDims.sizeCreationScale = this.pdfViewerService.currentScale;
				}
			}
		});
	}

	roundedWidth(w: number){
		return Math.round(w);
	}


	ngAfterViewInit() {
		this.resizeObserver.observe(this.editableDiv.nativeElement);
	}

	getEditableDiv() {
		return this.editableDiv;
	}

	onDragEnd(event: DragEvent) {
		if (!event.clientX || !event.clientY) return;
		this.mouseX = event.clientX - this.dragOffsetX
		this.mouseY = event.clientY - this.dragOffsetY
		this.isDragging = false;
		this.positionChanged.emit({ top: this.mouseY, left: this.mouseX })

	}

	onDragStart(event: MouseEvent) {

		const rect = (event.target as HTMLElement).getBoundingClientRect();

		// Store the offset between mouse and top-left of box
		this.dragOffsetX = event.clientX - rect.left;
		this.dragOffsetY = event.clientY - rect.top;
		this.isDragging = true;
	}

	onInput(event: Event) {
		const text = (event.target as HTMLElement).innerText;
		const savedBox = this.textEditService.textboxes.find(b => b.id == this.box.id);
		if (savedBox) {
			savedBox.text = text;
		}
	}

	@HostListener('document:click', ['$event'])
	onDocumentClick(event: MouseEvent) {
		try {
			if (this.editableDiv == null) return;
			const clickedInsideTextBox = this.editableDiv.nativeElement.contains(event.target);
			const eventTarget = (event.target as HTMLElement)

			let clickInsideColorPalette = false;
			let node = eventTarget
			while(node.parentElement)
			{
				clickInsideColorPalette = node?.id === "TextStyleContainer" ? true : false;
				if (clickInsideColorPalette) break;
				node = node.parentElement
			}


			if (!clickInsideColorPalette) {
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
}

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, HostListener } from '@angular/core';
import { TextEditService } from '../../services/text-edit-service';
import { CommonModule } from '@angular/common';
import { TextBox } from '../../models/TextBox';

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


	constructor(public textEditService: TextEditService) { }
	ngOnInit() {
		console.log("init TextBoxComponent")
		this.resizeObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				const { width, height } = entry.target.getBoundingClientRect();
				const box = this.textEditService.textboxes.find(b => b.id === this.box.id);

				if (box) {
					console.log('Div resized:', width, height, box, box.baseHeight, box.baseWidth);
					box.BoxDims.resizedWidth = width
					box.BoxDims.resizedHeight = height
				}
			}
		});
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
			const clickedInsideTextBox = this.editableDiv.nativeElement.contains(event.target);
			const eventTarget = (event.target as HTMLElement)

			const clickInsideColorPaletteArea = eventTarget.parentElement?.id === "colorBar" ? true : false;
			const clickInsideColorPalette = eventTarget?.id === "colorBar" ? true : false;

			if ((!clickInsideColorPalette && !clickInsideColorPaletteArea)) {
				this.currentlyEditing = clickedInsideTextBox;
				this.textBoxEditClicked.emit(this.currentlyEditing)
				console.log(this.currentlyEditing)
				console.log("current box.id: ", this.box.id)
			}

		}
		catch (error) {
			// handle error here
		}

	}
}

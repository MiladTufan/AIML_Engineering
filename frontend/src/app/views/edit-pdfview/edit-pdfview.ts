import { Component, ElementRef, HostListener, Renderer2, signal, ViewChild, ViewContainerRef } from '@angular/core';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { PDFFileService } from '../../services/pdffile-service';
import { ToolbarComponent } from '../../components/toolbar/toolbar';
import { TextBox } from '../../models/TextBox';
import { TextEditService } from '../../services/text-edit-service';
import { TextStyleEditor } from '../../models/TextStyleEditor';
import { CustomTextEditBox } from '../../components/custom-text-edit-box/custom-text-edit-box';
@Component({
	selector: 'app-edit-pdfview',
	standalone: true,
	imports: [NgxExtendedPdfViewerModule, ToolbarComponent],
	templateUrl: './edit-pdfview.html',
	styleUrl: './edit-pdfview.css'
})
export class EditPDFView {

	//=================================================== Private variables =================================================
	private mouseX: number = 0;
	private mouseY: number = 0;
	private isDragging: Boolean = false;
	private allTextBoxCompRef: any[] = []

	//=================================================== Public variables ==================================================
	public pdfSrc = signal(new Uint8Array)
	public pageNum: number = 1;

	//==================================================== Children =========================================================
	@ViewChild('pdfViewer', { read: ElementRef }) pdfViewerRef!: ElementRef;
	@ViewChild('dynamicContainer', { read: ViewContainerRef }) dynamicContainer!: ViewContainerRef;
	@ViewChild(ToolbarComponent) toolbar!: ToolbarComponent;

	//=================================================== Constructor =======================================================
	constructor(private fileService: PDFFileService, private textEditService: TextEditService, private renderer: Renderer2) { }

	// ================================================== Listener functions ================================================
	@HostListener("document:mousemove", ["$event"])
	trackmouse(event: MouseEvent) {
		const rect = (this.pdfViewerRef.nativeElement as HTMLElement).getBoundingClientRect();
		this.mouseX = event.clientX;
		this.mouseY = event.clientY - rect.top;
	}

	// =================================================== Click Functions ==================================================
	public onMouseClick(event: Event) {
		if (this.isDragging) {
			this.createTextBox();
			this.isDragging = false;
		}
	}

	onTextBoxEditClick(id: number, editState: Boolean) {
		if (editState) {

			this.textEditService.currentFocusTextBoxId = id;
			this.toolbar.enableTextStyleEditor(editState);
		}
		else {
			if (id === this.textEditService.currentFocusTextBoxId)
				this.toolbar.enableTextStyleEditor(editState);
		}
	}


	//=================================================== Methods ===========================================================
	getPageHeight() {
		return (this.pdfViewerRef.nativeElement as HTMLElement).getBoundingClientRect().height;
	}

	public updateTextBoxPos(id: number, pos: { top: number, left: number }) {
		const savedBox = this.textEditService.textboxes.find(b => b.id === id);
		const rect = (this.pdfViewerRef.nativeElement as HTMLElement).getBoundingClientRect();


		if (savedBox) {
			savedBox.top = (pos.top - rect.top) //+ this.scrollableContainer!.scrollTop;
			savedBox.left = pos.left;
			savedBox.pageId = this.pageNum;
		}
	}


	public startDraggingTextBox() {
		this.isDragging = true;
	}



	async ngOnInit() {
		let file = this.fileService.getFile()!
		const reader = new FileReader()
		reader.readAsArrayBuffer(file)

		reader.onload = () => {
			const arrayBuffer = new Uint8Array(reader.result as ArrayBuffer);
			this.pdfSrc.set(arrayBuffer)
		}
	}


	//------------------------------------------------------------------------------------
	public createTextBox() {

		this.mouseY += (this.getPageHeight() * (this.pageNum - 1))

		const newTextBox = new TextBox(this.textEditService.textboxes.length + 1, Number(this.pageNum),
			this.mouseY, this.mouseX, "Text", new TextStyleEditor())

		this.textEditService.textboxes.push(newTextBox);

		const pdfViewerDiv = this.pdfViewerRef.nativeElement.querySelector('.pdfViewer');
		const editTextBoxComp = this.dynamicContainer.createComponent(CustomTextEditBox)

		editTextBoxComp.instance.box = newTextBox;
		editTextBoxComp.instance.textBoxEditClicked.subscribe((event: any) => this.onTextBoxEditClick(newTextBox.id, event))
		editTextBoxComp.instance.positionChanged.subscribe((event: any) => this.updateTextBoxPos(newTextBox.id, event))

		// editTextBoxComp.instance.textBoxEditClicked.subscribe((event: any) => this.removeTextBox(newTextBox.id, event))
		let scale = 0.5
		const editTextBoxCompRef = editTextBoxComp.location.nativeElement;



		// this.renderer.setStyle(editTextBoxCompRef, 'position', 'absolute');
		// this.renderer.setStyle(editTextBoxCompRef, 'top',  "-10%");  // Example position
		// this.renderer.setStyle(editTextBoxCompRef, 'left', `${newTextBox.left}px`);
		this.renderer.setStyle(editTextBoxCompRef, 'z-index', '50'); // Make sure it's above PDF

		this.allTextBoxCompRef.push(editTextBoxCompRef)

		this.renderer.appendChild(pdfViewerDiv, editTextBoxCompRef);


	}
}



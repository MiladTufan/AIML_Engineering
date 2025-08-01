import { PdfViewerComponent } from '../../components/pdf-viewer-component/pdf-viewer-component';
import { Component, ComponentRef, ElementRef, HostListener, Renderer2, signal, ViewChild, ViewContainerRef } from '@angular/core';
import { PDFFileService } from '../../services/pdffile-service';
import { ToolbarComponent } from '../../components/toolbar-component/toolbar-component';
import { CustomTextEditBox } from '../../components/custom-text-edit-box/custom-text-edit-box';
import { TextBox } from '../../models/TextBox';
import { PDFViewerService } from '../../services/pdfviewer-service';
import { TextEditService } from '../../services/text-edit-service';
import { TextStyleEditor } from '../../models/TextStyleEditor';



@Component({
	selector: 'app-edit-pdfview',
	imports: [PdfViewerComponent, ToolbarComponent],
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
	public scrollMode: number = 0;
	public currentZoom: number = 1.0;

	//==================================================== Children =========================================================
	@ViewChild('pdfViewer', { read: ElementRef }) pdfViewerRef!: ElementRef;
	@ViewChild('dynamicContainer', { read: ViewContainerRef }) dynamicContainer!: ViewContainerRef;
	@ViewChild(ToolbarComponent) toolbar!: ToolbarComponent;

	//=================================================== Constructor =======================================================
	// constructor(private fileService: PDFFileService, private textEditService: TextEditService, private renderer: Renderer2,
	// 	private pdfService: NgxExtendedPdfViewerService
	// ) { }

	constructor(private fileService: PDFFileService, private renderer: Renderer2, private pdfViewService: PDFViewerService,
		private textEditService: TextEditService, private viewContainerRef: ViewContainerRef
	) { }

	// ================================================== Listener functions ================================================
	@HostListener("document:mousemove", ["$event"])
	trackmouse(event: MouseEvent) {
		const rect = (this.pdfViewerRef.nativeElement as HTMLElement).getBoundingClientRect();
		this.mouseX = event.clientX;
		this.mouseY = event.clientY - rect.top;
	}

	async ngOnInit() {
		if (this.pdfViewerRef) this.textEditService.pdfViewerContainer = this.pdfViewerRef
		if (this.dynamicContainer) this.textEditService.dynamicContainer = this.viewContainerRef
	}

	public onMouseClick(event: Event) {
		if (this.isDragging) {
			this.createTextBox();
			this.isDragging = false;
		}
	}

	startDraggingTextBox(){
		this.isDragging = true;
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

	//------------------------------------------------------------------------------------

	public updateTextBoxPos(id: number, pos: { top: number, left: number }) {
		const savedBox = this.textEditService.textboxes.find(b => b.id === id);
		const rect = (this.pdfViewerRef.nativeElement as HTMLElement).getBoundingClientRect();


		if (savedBox) {
			savedBox.top = (pos.top - rect.top) * this.currentZoom //+ this.scrollableContainer!.scrollTop;
			savedBox.left = pos.left * this.currentZoom;
			savedBox.pageId = this.pageNum;
		}
	}

	public createTextBoxContainer(textBox: TextBox) {
		const editTextBoxComp = this.viewContainerRef.createComponent(CustomTextEditBox)
		editTextBoxComp.instance.box = textBox;
		editTextBoxComp.instance.textBoxEditClicked.subscribe((event: any) => this.onTextBoxEditClick(textBox.id, event))
		editTextBoxComp.instance.positionChanged.subscribe((event: any) => this.updateTextBoxPos(textBox.id, event))
		return editTextBoxComp
	}

	public createTextBox() {
		this.mouseY += (this.pdfViewService.pageHeight * (this.pageNum - 1))
		const newTextBox = new TextBox(this.textEditService.textboxes.length + 1, this.pageNum,
			this.mouseY, this.mouseX, "Text", new TextStyleEditor())

		this.textEditService.textboxes.push(newTextBox);

		const editTextBoxComp = this.createTextBoxContainer(newTextBox);
		// editTextBoxComp.instance.textBoxEditClicked.subscribe((event: any) => this.removeTextBox(newTextBox.id, event))
		const editTextBoxCompRef = editTextBoxComp.location.nativeElement;
		this.renderer.setStyle(editTextBoxCompRef, 'z-index', '50'); // Make sure it's above PDF

		console.log(newTextBox)
		return editTextBoxComp
	}
}	

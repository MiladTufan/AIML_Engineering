import { PdfViewerComponent } from '../../components/pdf-viewer-component/pdf-viewer-component';
import { Component, ComponentRef, ElementRef, HostListener, Renderer2, signal, ViewChild, ViewContainerRef } from '@angular/core';
import { PDFFileService } from '../../services/pdffile-service';
import { ToolbarComponent } from '../../components/toolbar-component/toolbar-component';
import { CustomTextEditBox } from '../../components/custom-text-edit-box/custom-text-edit-box';
import { TextBox } from '../../models/TextBox';
import { PDFViewerService } from '../../services/pdfviewer-service';
import { TextEditService } from '../../services/text-edit-service';
import { TextStyleEditor } from '../../models/TextStyleEditor';
import { Subscription } from 'rxjs';
import { Constants } from '../../models/constants';



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
	public currentPageNumber: number = 1;
	public scrollMode: number = 0;
	public currentZoom: number = 1.0;
	private pageNumberSub!: Subscription;

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
		this.mouseY = event.clientY
	}

	async ngOnInit() {
		if (this.pdfViewerRef) this.textEditService.pdfViewerContainer = this.pdfViewerRef
		if (this.dynamicContainer) this.textEditService.dynamicContainer = this.viewContainerRef

		this.pageNumberSub = this.pdfViewService.currentPage$.subscribe(val => {
			this.currentPageNumber = val;
		});
	}

	public onMouseClick(event: Event) {
		if (this.isDragging) {
			this.createTextBox();
			this.isDragging = false;
		}
	}

	startDraggingTextBox() {
		this.isDragging = true;
	}

	//------------------------------------------------------------------------------------
	public createTextBox() {
		const page = this.pdfViewService.getPageWithNumber(this.currentPageNumber)
		const text_layer = page?.htmlContainer?.querySelector(Constants.OVERLAY_TEXT)

		const rect = (text_layer as HTMLElement).getBoundingClientRect();
		// const rect = (this.pdfViewerRef.nativeElement as HTMLElement).getBoundingClientRect();
		const top = (this.mouseY) - rect.top
		const left = (this.mouseX ) - rect.left
		const width = 110
		const height = 30

		const box_dims = {  top: top, 
							left: left, 
							width: width * this.pdfViewService.currentScale, 
							height: height * this.pdfViewService.currentScale, 
							resizedHeight: height * this.pdfViewService.currentScale, 
							resizedWidth: width * this.pdfViewService.currentScale, 
							currentScale: this.pdfViewService.currentScale,
							creationScale: this.pdfViewService.currentScale }
	

			// top: (box.BoxDims.top - baseMarginScale+16) * this.scale, 
			// 						  left: box.BoxDims.left  * this.scale, 
			// 						  width: box.BoxDims.width * this.scale, 
			// 						  height:  box.BoxDims.height * this.scale,

		const styleState = new TextStyleEditor()
		styleState.font_size = styleState.baseFontSize * this.pdfViewService.currentScale

		// this.mouseY += (this.pdfViewService.pageHeight * (this.currentPageNumber - 1))
		this.textEditService.createTextBox(box_dims, styleState, this.currentPageNumber, this.pdfViewService.currentScale, this.pdfViewService.currentScrollTop)
	}
}	

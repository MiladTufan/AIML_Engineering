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
import { Constants } from '../../models/constants/constants';
import { provideHttpClient } from '@angular/common/http';



@Component({
	selector: 'app-edit-pdfview',
	standalone: true,
	imports: [PdfViewerComponent, ToolbarComponent],
	templateUrl: './edit-pdfview.html',
	styleUrl: './edit-pdfview.css',
})
export class EditPDFView {
	//=================================================== Private variables =================================================
	private mouseX: number = 0;
	private mouseY: number = 0;
	private canCreateTextbox: Boolean = false;

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
	constructor(private fileService: PDFFileService, private renderer: Renderer2, private pdfViewService: PDFViewerService,
		private textEditService: TextEditService, private viewContainerRef: ViewContainerRef
	) { }

	// ================================================== Listener functions ================================================

	//=======================================================================================================================
	// Listen on Mouseclick over the entire Window. Used for determining the coordinates of any object placed inside
	// the document.
	//=======================================================================================================================
	@HostListener("document:mousemove", ["$event"])
	trackmouse(event: MouseEvent) {
		this.mouseX = event.clientX;
		this.mouseY = event.clientY
	}

	//=======================================================================================================================
	// Is run when the View is initialized. Initializes the dynamic Container used to add dynamic elements likes textboxes.
	//=======================================================================================================================
	async ngOnInit() {
		if (this.dynamicContainer) this.textEditService.dynamicContainer = this.viewContainerRef

		this.pageNumberSub = this.pdfViewService.currentPage$.subscribe(val => {
			this.currentPageNumber = val;
		});
	}

	//=======================================================================================================================
	// Is run after the View is initialized. 
	//=======================================================================================================================
	ngAfterViewInit() {
		if (this.pdfViewerRef) this.textEditService.pdfViewerContainer = this.pdfViewerRef
		if (this.toolbar) this.textEditService.setToolbar(this.toolbar);
	}

	//=======================================================================================================================
	// When the user clicks on the textbox create button on the toolbar this function is fired.
	//=======================================================================================================================
	canCreateTextBox() {
		this.canCreateTextbox = true;
	}

	//=======================================================================================================================
	// This function is responsible for placing the Textbox inside the PDF canvas.
	//=======================================================================================================================
	public createTextBox(event: Event) {
		if (this.canCreateTextbox) {
			this.canCreateTextbox = false;
			const containerElement = event.target as HTMLElement;
			const pageNumber = parseInt(containerElement.id?.split('-')[1]);

			const page = this.pdfViewService.getPageWithNumber(pageNumber)
			const text_layer = page?.htmlContainer?.querySelector(Constants.OVERLAY_TEXT)

			const rect = (text_layer as HTMLElement).getBoundingClientRect();
			// const rect = (this.pdfViewerRef.nativeElement as HTMLElement).getBoundingClientRect();
			const top = (this.mouseY) - rect.top
			const left = (this.mouseX) - rect.left
			const width = 110
			const height = 30

			const box_dims = {
				top: top,
				left: left,
				width: width * this.pdfViewService.currentScale,
				height: height * this.pdfViewService.currentScale,
				resizedHeight: 0,
				resizedWidth: 0,
				currentScale: this.pdfViewService.currentScale,
				posCreationScale: this.pdfViewService.currentScale,
				sizeCreationScale: this.pdfViewService.currentScale
			}


			// top: (box.BoxDims.top - baseMarginScale+16) * this.scale, 
			// 						  left: box.BoxDims.left  * this.scale, 
			// 						  width: box.BoxDims.width * this.scale, 
			// 						  height:  box.BoxDims.height * this.scale,

			const styleState = new TextStyleEditor()
			styleState.font_size = styleState.baseFontSize * this.pdfViewService.currentScale

			// this.mouseY += (this.pdfViewService.pageHeight * (this.currentPageNumber - 1))
			this.pdfViewService.setCodeResizeTimeout()
			this.textEditService.createTextBox(box_dims, styleState, pageNumber, 
								this.pdfViewService.currentScale, this.pdfViewService.currentScrollTop)
		}
	}
}	

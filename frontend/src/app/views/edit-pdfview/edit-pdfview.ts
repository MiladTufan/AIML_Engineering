import { Component, ComponentRef, ElementRef, HostListener, inject, Renderer2, signal, ViewChild, ViewContainerRef } from '@angular/core';
import { TextEditService } from '../../services/box-services/text-edit-service';
import { Subscription } from 'rxjs';
import { Constants } from '../../models/constants/constants';
import { EntityManagerService } from '../../services/box-services/entity-manager-service';
import { ImgBoxService } from '../../services/box-services/img-box-service';
import { AbortException } from 'pdfjs-dist';
import { ToolbarComponent } from '../../components/pdf-components/toolbar-component/toolbar-component';
import { PdfViewerComponent } from '../../components/pdf-components/pdf-viewer-component/pdf-viewer-component';
import { PDFViewerService } from '../../services/pdf-services/pdfviewer-service';
import { PDFFileService } from '../../services/pdf-services/pdffile-service';
import { BoxCreationService } from '../../services/box-services/box-creation-service';


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
	private canCreateImgBox: Boolean = false;


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

	private pdfViewService: PDFViewerService = inject(PDFViewerService)
	private entityManagerService: EntityManagerService = inject(EntityManagerService)
	private pdfFileService: PDFFileService = inject(PDFFileService)
	private textEditService: TextEditService = inject(TextEditService)
	private imgBoxService: ImgBoxService = inject(ImgBoxService)
	private boxCreationService: BoxCreationService = inject(BoxCreationService)

	//=================================================== Constructor =======================================================
	constructor(private viewContainerRef: ViewContainerRef) { }

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
	}

	//=======================================================================================================================
	// When the user clicks on the textbox create button on the toolbar this function is fired.
	//=======================================================================================================================
	canCreateTextBox() {
		this.canCreateTextbox = true;
	}

	//=======================================================================================================================
	// When the user clicks on the Image Insert button on the toolbar this function is fired.
	//=======================================================================================================================
	canCreateImg() {
		this.canCreateImgBox = true;
	}

	/**
	 * Select an Image file on ImageInsert click
	 * @param event 
	 */
	onFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			const file = input.files[0];
			this.pdfFileService.imgFile = file
		}
	}

	//=======================================================================================================================
	// This function is responsible for placing the Image inside the PDF canvas.
	//=======================================================================================================================
	public createImageBox(event: Event) {
		if (this.canCreateImgBox) {
			this.canCreateImgBox = false;
			const containerElement = event.target as HTMLElement;
			const imgFile = this.pdfFileService.imgFile

			if (imgFile) {
				const pageNumber = parseInt(containerElement.id?.split('-')[1]);
				const page = this.pdfViewService.getPageWithNumber(pageNumber)
				const entityParentContainer = page?.htmlContainer?.querySelector(Constants.OVERLAY_TEXT)
				const entityParentRect = (entityParentContainer as HTMLElement).getBoundingClientRect();
				this.imgBoxService.getImageDimensions(imgFile).then(dim => {
					console.log("Original width:", dim.width);
					console.log("Original height:", dim.height);

					const blockObj = this.boxCreationService.createBlockObjectAndInitDims(pageNumber, this.mouseX, this.mouseY,
						this.pdfViewService.currentScale, entityParentRect, dim.width, dim.height, false)

					const ret = this.boxCreationService.createImgBox(blockObj, blockObj.id, pageNumber, URL.createObjectURL(imgFile))

					// const imgBox = this.imgBoxService.toImgBox(blockObj)
					// imgBox.src = URL.createObjectURL(imgFile);
					// this.entityManagerService.addOrReplaceBlockObject(imgBox, imgBox.id, false)

					// const ret = this.imgBoxService.placeImgBoxOntoCanvas(pageNumber, imgBox)

					// ret.parent.instance.positionChanged.subscribe((event: any) => this.entityManagerService.executeMove(imgBox, event, pageNumber))
				})
				return;
			}

			console.error("Invalid Image file");
			throw new AbortException("Invalid Image File in Edit-pdfview createImageBox.")
		}
	}
	//=======================================================================================================================
	// This function is responsible for placing the Textbox inside the PDF canvas.
	//=======================================================================================================================
	// public createTextBox(event: Event) {
	// 	if (this.canCreateTextbox) {
	// 		this.canCreateTextbox = false;
	// 		const containerElement = event.target as HTMLElement;
	// 		const pageNumber = parseInt(containerElement.id?.split('-')[1]);

	// 		const page = this.pdfViewService.getPageWithNumber(pageNumber)
	// 		const text_layer = page?.htmlContainer?.querySelector(Constants.OVERLAY_TEXT)

	// 		const rect = (text_layer as HTMLElement).getBoundingClientRect();
	// 		// const rect = (this.pdfViewerRef.nativeElement as HTMLElement).getBoundingClientRect();
	// 		const top = (this.mouseY) - rect.top
	// 		const left = (this.mouseX) - rect.left
	// 		const width = 110
	// 		const height = 30

	// 		const box_dims = {
	// 			top: top,
	// 			left: left,
	// 			width: width * this.pdfViewService.currentScale,
	// 			height: height * this.pdfViewService.currentScale,
	// 			resizedHeight: 0,
	// 			resizedWidth: 0,
	// 			currentScale: this.pdfViewService.currentScale,
	// 			posCreationScale: this.pdfViewService.currentScale,
	// 			sizeCreationScale: this.pdfViewService.currentScale
	// 		}

	// 		const styleState = new TextStyle()
	// 		styleState.textFontSize = styleState.textBaseFontSize * this.pdfViewService.currentScale

	// 		// this.mouseY += (this.pdfViewService.pageHeight * (this.currentPageNumber - 1))
	// 		this.pdfViewService.setCodeResizeTimeout()
	// 		const ret = this.textEditService.createTextBox(box_dims, styleState, pageNumber,
	// 			this.pdfViewService.currentScale, this.pdfViewService.currentScrollTop)

	// 		ret.comp.instance.positionChanged.subscribe((event: any) => this.entityManagerService.executeMove(ret.box, event, pageNumber))
	// 	}
	// }

	public createTextBox(event: Event) {
		if (this.canCreateTextbox) {

			this.canCreateTextbox = false;
			const containerElement = event.target as HTMLElement;
			const pageNumber = parseInt(containerElement.id?.split('-')[1]);
			const page = this.pdfViewService.getPageWithNumber(pageNumber)
			const entityParentContainer = page?.htmlContainer?.querySelector(Constants.OVERLAY_TEXT)
			const entityParentRect = (entityParentContainer as HTMLElement).getBoundingClientRect();

			const blockObj = this.boxCreationService.createBlockObjectAndInitDims(pageNumber, this.mouseX, this.mouseY,
				this.pdfViewService.currentScale, entityParentRect)

			this.boxCreationService.createTextBox(blockObj, blockObj.id, pageNumber)

		}
	}
}	

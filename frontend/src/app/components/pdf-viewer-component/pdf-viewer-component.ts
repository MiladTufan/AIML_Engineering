import { Component, ElementRef, Input, ViewChild, ViewContainerRef } from '@angular/core';

import * as pdfjsLib from "pdfjs-dist";
import { PDFFileService } from '../../services/pdffile-service';
import { PDFViewerService } from '../../services/pdfviewer-service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TextEditService } from '../../services/text-edit-service';
import { Page } from '../../models/Page';
import { Constants } from '../../models/constants/constants';
import { debounceTime, Subject } from 'rxjs';

import { AlertService } from '../../services/alert-service';
import { TextBox } from '../../models/TextBox';
import { PageInfoComponent } from '../page-info-component/page-info-component';
import { SessionService } from '../../services/communication/session-service';
import { MiniPage } from '../../models/globalEdit';
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = "assets/pdf.worker.min.mjs";


//=======================================================================================================================
// Main Component handling the PDF logic.
//=======================================================================================================================
@Component({
	selector: 'app-pdf-viewer-component',
	imports: [],
	templateUrl: './pdf-viewer-component.html',
	styleUrl: './pdf-viewer-component.css'
})
export class PdfViewerComponent {


	//=================================================== Private variables =================================================
	private pdfDocument: any;
	private currentPageNumber: number = 1;
	private devicePixelRatio = window.devicePixelRatio || 1;
	private scale = 1.0 * this.devicePixelRatio;
	private pageNumberSub!: Subscription;
	private alreadyRanObserver = false;
	private renderQueue = new Set<number[]>();
	private currentScale = 1.0;
	private minScale = 0.6
	private maxScale = 6.09
	private observer: any;
	private renderTrigger = new Subject<number>();

	//=================================================== Public variables ==================================================
	public totalPages: number = 0;
	public pdfSrc: string | Uint8Array = ""
	public renderMode = 0 // 0 = render all pages, 1 = render 1 page
	public transformOrigin = '0px 0px';
	public cssScale = 'scale(1)';

	//==================================================== Children =========================================================
	@ViewChild("pdfContainer", { static: true }) pdfContainer!: ElementRef<HTMLDivElement>;
	@ViewChild('dynamicContainer', { read: ViewContainerRef }) dynamicContainer!: ViewContainerRef;


	//==================================================== Constructor ======================================================
	constructor(private fileService: PDFFileService, private sessionService: SessionService,
		private pdfViewerService: PDFViewerService,
		private textEditService: TextEditService, private alertService: AlertService) {
		this.renderTrigger.pipe(debounceTime(10)).subscribe((finalScale) => {

			Promise.all(
				Array.from(this.renderQueue).map(renderItem => {
					this.renderPage(renderItem[0], false, renderItem[1])
				})
			).then(() => {
				this.renderQueue.clear()
				this.transformOrigin = '0px 0px';
				// this.cssScale = `scale(1)`;
			})
		});
	}


	//==================================================== NG ===============================================================
	async ngOnInit() {
		this.pdfViewerService.preventWindowZoomIn()
		this.loadPDF();
		this.handleScroll();
		this.subscribeToVisiblePages();
		this.pageNumberSub = this.pdfViewerService.currentPage$.subscribe(val => {
			this.currentPageNumber = val;
		});

	}

	ngAfterViewInit() {
		if (this.dynamicContainer) this.pdfViewerService.setDynamicContainerRef(this.dynamicContainer)
	}



	ngOnDestroy() {
		this.pageNumberSub.unsubscribe();
		this.observer.disconnect();
	}

	//==================================================== Methods ==========================================================

	//=======================================================================================================================
	// Handle scroll of user on the PDF. This functions sets the scroll listener and also implements pagecounting logic.
	//=======================================================================================================================
	handleScroll() {
		if (this.pdfContainer) {
			this.pdfViewerService.setPDFScrollContainer(this.pdfContainer);
			this.pdfViewerService.dynamicContainer = this.dynamicContainer;

			this.pdfContainer.nativeElement.addEventListener('scroll', (event) => {
				this.pdfViewerService.currentScrollTop = this.pdfContainer.nativeElement.scrollTop;
				this.currentPageNumber = this.pdfViewerService.getPageNumberFromScrolltop()
				this.pdfViewerService.setCurrentPage(this.currentPageNumber);

				// TODO change this => This creates an observe to watch visibile pages ... this needs to be available ASAP and not on scroll!!
				if (!this.alreadyRanObserver) this.createObserver();

			})
		}
	}

	//=======================================================================================================================
	// The observer tells us which pages are currently visibile on the screen. Here we subscribe to the visibile pages
	// and render a page once it comes into the view.
	//=======================================================================================================================
	subscribeToVisiblePages() {
		this.pdfViewerService.visiblePages.subscribe(set => {

			for (const pageNum of set) {
				const page = this.pdfViewerService.allRenderedPages.find(p => p.pageNum === pageNum)
				if (page?.currentScale != this.scale) {
					this.renderPage(pageNum, false, this.scale)
					console.log("re-rendering page: ", pageNum)
				}
			}
		});
	}

	//=======================================================================================================================
	// Checks if the observed pages are currently visible. If yes they are added to the VisiblePages.
	//=======================================================================================================================
	checkEntry(entries: any) {
		for (const entry of entries) {
			const id = entry.target.id;
			const pageNumber = parseInt(id?.split('-')[1]);

			if (entry.isIntersecting) {
				this.pdfViewerService.addVisiblePages(pageNumber)
				if (!this.pdfViewerService.allRenderedPages.find(p => p.pageNum === pageNumber))
					this.renderPage(pageNumber, false, this.scale)

			}
			else {
				this.pdfViewerService.removeVisiblePages(pageNumber)
			}
		}
	}

	//=======================================================================================================================
	// Creates the visible pages observer. This Observe observes all pages and tells us which pages are currently visibile
	//=======================================================================================================================
	async createObserver() {
		this.alreadyRanObserver = true;
		this.observer = new IntersectionObserver(
			async entries => {
				this.checkEntry(entries)
			},
			{
				root: this.pdfContainer.nativeElement,
				rootMargin: '200px 0px 200px 0px', // top, right, bottom, left
				threshold: 0.01 // Trigger if at least 10% is visible
			}
		);

		requestAnimationFrame(() => {
			for (let i = 1; i <= this.totalPages; i++) {
				const pageContainer = this.pdfViewerService.getCanvasForPage(i);
				if (pageContainer) this.observer.observe(pageContainer);
			}
		});
	}


	loadingHelper(file: ArrayBuffer | File) {
		const pdfjs = pdfjsLib as any;
		const reader = new FileReader()
		reader.readAsArrayBuffer(new Blob([file]))
		console.log(this.textEditService.textboxes.length)

		reader.onload = async () => {
			const arrayBuffer = new Uint8Array(reader.result as ArrayBuffer);
			this.pdfSrc = arrayBuffer;

			const loadingTask = pdfjs.getDocument({ data: this.pdfSrc });
			this.pdfDocument = await loadingTask.promise;
			this.totalPages = this.pdfDocument.numPages;
			const container = this.pdfContainer.nativeElement;
			container.innerHTML = ""; // Clear previous content
			this.pdfViewerService.setTotalPages(this.totalPages);
			this.pdfViewerService.setCurrentPage(1);

			if (this.renderMode == 0) {
				for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
					this.renderPage(pageNum, true, this.scale);
				}
			}
		}
	}

	//=======================================================================================================================
	// This function loads the user PDF. Depending on rendermode it loads all pages or only Page by Page.
	// rendermode == 0 => all pages, rendermode == 1 => only 1 page
	//=======================================================================================================================
	async loadPDF() {
		try {
			const file = this.fileService.getFile()
			if (file)
				this.loadingHelper(file)
			else {
				const signed_sid = this.sessionService.getSessionIdFromBrowser("session_id")
				if (signed_sid) {
					this.sessionService.getPDF(signed_sid).subscribe(file => {
						this.sessionService.getEdits(signed_sid).subscribe(edits => {
							edits.pageEdits.forEach((element: MiniPage) => {
								element.textboxes.forEach(box => {
									this.textEditService.textboxes.push(box)
								})
							});
							this.loadingHelper(file)
						})
					})
				}
				else {
					console.error("PDF_VIEWER: No signed session id!")
				}
			}
		} catch (error) {
			console.error("Error loading PDF:", error);
		}
	}

	//=======================================================================================================================
	// This function creates all the necessary containers to render a page. That includes the pageContainer, the canvas 
	// for the actual page and any layers on top of the page e.g. textBoxLayer (where all textboxes reside).
	//=======================================================================================================================
	createPageContainers(pageNumber: number, renderdummy: Boolean, scale: number) {
		const canvas = document.createElement("canvas");
		const textBoxLayer = document.createElement("div");
		let textLayer = document.createElement("div");
		let pageContainer = document.createElement("div");

		const canvasContainer = document.createElement("div");

		const pageInfo = this.pdfViewerService.dynamicContainer?.createComponent(PageInfoComponent);
		pageInfo!.instance.pageNumber = pageNumber;
		pageInfo!.instance.width = 60 * scale;
		pageInfo!.instance.fontSize = 32 * scale;
		pageInfo!.instance.borderRadius = 9 * scale;

		canvas.id = `page-${pageNumber}`;
		canvasContainer.id = `canvasContainer-${pageNumber}`;

		canvasContainer.style.display = "flex";
		canvasContainer.style.gap = "8px";

		pageContainer.id = `pageContainer-${pageNumber}`;
		textBoxLayer.className = "text-box-layer"

		if (!renderdummy) {
			pageContainer.className = "mt-1 sm:mt-3 md:mt-4 mx-auto relative block w-full max-w-fit sm:max-w-[70%] md:max-w-[90%]";

			// canvas.className = `page-${pageNumber} w-full block border border-gray-300 shadow-lg -mb-[305px]`;

			if (this.scale == 1.0)
				canvas.className = `page-${pageNumber} block border border-gray-300 shadow-lg -mb-[305px]`;
			else
				canvas.className = `page-${pageNumber} block border border-gray-300 shadow-lg`;


		}
		else {
			pageContainer.className = `mt-1 sm:mt-3 md:mt-4 mx-auto relative block w-full max-w-fit sm:max-w-[70%] md:max-w-[90%]`;
			canvas.className = `page-${pageNumber} block border border-gray-300 shadow-lg mx-auto`;
		}

		canvasContainer.appendChild(canvas)
		canvasContainer.appendChild(pageInfo!.location.nativeElement)

		pageContainer.appendChild(textBoxLayer)
		pageContainer.appendChild(canvasContainer)
		return { canvas: canvas, textBoxLayer: textBoxLayer, textLayer: textLayer, pageContainer: pageContainer, canvasContainer: canvasContainer }
	}

	//=======================================================================================================================
	// This function recreates all the textboxes according to the scale
	//=======================================================================================================================
	recreateTextBoxesForPage(boxesForPage: TextBox[], pageNumber: number,
		scale: number, textBoxLayer: HTMLDivElement) {

		boxesForPage.forEach(box => {
			if (box.pageId === pageNumber) {

				let newBaseWidth = box.baseWidth;
				let newBaseHeight = box.baseHeight;

				const condition = (box.BoxDims.resizedHeight != 0 || box.BoxDims.resizedWidth != 0)
				if (condition) {
					newBaseWidth = box.BoxDims.resizedWidth;
					newBaseHeight = box.BoxDims.resizedHeight;
				}


				const finalWidth = newBaseWidth * (scale / box.BoxDims.sizeCreationScale)
				const finalHeight = newBaseHeight * (scale / box.BoxDims.sizeCreationScale)

				const box_dims = {
					top: box.baseTop * (scale / box.BoxDims.posCreationScale),
					left: box.baseLeft * (scale / box.BoxDims.posCreationScale),
					width: finalWidth,
					height: finalHeight,
					resizedHeight: 0,
					resizedWidth: 0,
					currentScale: scale,
					posCreationScale: box.BoxDims.posCreationScale,
					sizeCreationScale: box.BoxDims.sizeCreationScale
				}

				box.textStyleEditorState.font_size = box.textStyleEditorState.baseFontSize * scale;
				//const [left, top] = box.left, box.top //viewport.convertToViewportPoint(box.left, box.top);

				this.pdfViewerService.setCodeResizeTimeout()

				const ret = this.textEditService.createTextBox(box_dims, box.textStyleEditorState, pageNumber,
					scale, this.pdfViewerService.currentScrollTop, true, box.id)

				ret.box.baseHeight = newBaseHeight
				ret.box.baseWidth = newBaseWidth
				textBoxLayer.appendChild(ret.comp.location.nativeElement)
			}
		})
	}

	//=======================================================================================================================
	// This function assigns a Page to the alreadyRenderedPages
	//=======================================================================================================================
	assignPageToRendered(newPage: Page) {
		const renderedPage = this.pdfViewerService.allRenderedPages.find(p => p.pageNum === newPage.pageNum)
		if (renderedPage) {
			const idx = this.pdfViewerService.allRenderedPages.indexOf(renderedPage);
			this.pdfViewerService.allRenderedPages.splice(idx, 1, newPage);
		}
		else
			this.pdfViewerService.allRenderedPages.push(newPage)
	}

	//=======================================================================================================================
	// This function renders an entire page and instantiates all objects on that page.
	//=======================================================================================================================
	async renderPage(pageNumber: number, renderdummy: Boolean = true, scale: number) {
		let page: any;
		let viewport: any;
		if (pageNumber === 1)
			renderdummy = false;

		console.log("rendering page: ", pageNumber)
		page = await this.pdfDocument.getPage(pageNumber);

		if (!renderdummy) {
			page = await this.pdfDocument.getPage(pageNumber);
			viewport = page.getViewport({ scale: scale });
			this.pdfViewerService.setPageHeight(viewport.height);
		}

		const container = this.pdfContainer.nativeElement;
		let { canvas, textBoxLayer, textLayer, pageContainer, canvasContainer } = this.createPageContainers(pageNumber, renderdummy, scale)

		// scale margin top
		let baseMarginScale = 16
		if (scale > 1.0 && pageNumber > 1) baseMarginScale = this.pdfViewerService.getScaledMargin(scale)

		const boxesForPage = this.textEditService.textboxes.filter(b => b.pageId == pageNumber)
		this.recreateTextBoxesForPage(boxesForPage, pageNumber, scale, textBoxLayer)

		const existingPageContainer = container.querySelector("#" + pageContainer.id)
		if (existingPageContainer != null) {
			const textOld = existingPageContainer.querySelector(Constants.OVERLAY_TEXT)
			const CanvasOld = existingPageContainer.querySelector("#" + canvasContainer.id)

			// recreate all objects on the page
			this.recreateTextBoxesForPage(boxesForPage, pageNumber, scale, textBoxLayer)

			existingPageContainer.replaceChild(textBoxLayer, textOld!)
			existingPageContainer.replaceChild(canvasContainer, CanvasOld!)

			if (!renderdummy) {
				existingPageContainer.className = "mt-1 sm:mt-3 md:mt-4 mx-auto relative block w-full max-w-fit sm:max-w-[70%] md:max-w-[90%]";
			}

			pageContainer = existingPageContainer as HTMLDivElement
		}
		else {
			container.appendChild(pageContainer);
		}

		if (!renderdummy) {
			const context = canvas.getContext("2d")!;
			canvas.height = viewport.height;
			canvas.width = viewport.width;

			pageContainer.style.marginTop = `${baseMarginScale}px`;
			pageContainer.style.width = `${viewport.width}px`;
			pageContainer.style.height = `${viewport.height}px`;

			if (pageNumber == this.pdfViewerService.totalPages)
				pageContainer.style.marginBottom = "128px";

			this.pdfViewerService.currentBaseMarginScale = baseMarginScale

			const renderContext = {
				canvasContext: context,
				viewport: viewport,
				intent: "print"
			};

			await page.render(renderContext).promise;
			const newPage = new Page(pageNumber, viewport, boxesForPage, viewport.height, viewport.width, 0, pageContainer, scale)
			this.assignPageToRendered(newPage)
		}
	}

	editActualPDF() {
		throw new Error("Not implemented");
		//============================ EXPERIMENTAL ====================================
		// use this for editing the PDF

		// text_layer.style.position = 'absolute';
		// text_layer.style.top = '0';
		// text_layer.style.left = '0';
		// text_layer.style.width = `${viewport.width}px`;
		// text_layer.style.height = `${viewport.height}px`;
		// text_layer.style.pointerEvents = 'none'; // optional, disables selection
		// text_layer.className = 'textLayer'; // optional, disables selection

		// const exists = pageContainer.querySelector(".textLayer")
		// if (exists != null) {
		// 	exists.replaceChildren()
		// 	text_layer = exists as HTMLDivElement;
		// }

		// // TODO This has all the PDF text ... use this for editing
		// page.getTextContent().then((textContent: any) => {
		// 	textContent.items.forEach((item: any) => {
		// 		const textDiv = document.createElement('div');
		// 		textDiv.textContent = item.str;

		// 		// Positionierung nach PDF Koordinaten (vereinfacht)
		// 		const tx = pdfjsLib.Util.transform(
		// 			viewport.transform,
		// 			item.transform
		// 		);

		// 		textDiv.style.position = 'absolute';
		// 		textDiv.style.left = `${tx[4]}px`;
		// 		textDiv.style.top = `${tx[5] - item.height}px`; // adjust Y
		// 		textDiv.style.fontSize = `${item.height*1.5}px`;
		// 		textDiv.style.fontFamily = item.fontName;
		// 		textDiv.style.border = '2px solid black';
		// 		textDiv.style.width = item.width;
		// 		textDiv.style.height = item.height;
		// 		textDiv.style.border = '1px dashed blue';

		// 		text_layer.appendChild(textDiv);
		// 	});
		// 	if (!exists)
		// 		pageContainer.appendChild(text_layer)

		// })


		// Annotations .. e.g. formular Felder usw.
		// page.getAnnotations().then((annotations: any) => {
		// 	console.log(annotations)
		// })

		// context.clearRect(0, 0, canvas.width, canvas.height);
	}

	//=======================================================================================================================
	// This function handles the zoom on the PDF page. It adds pages that are in visibile pages to a renderqueue.
	//=======================================================================================================================
	async onWheel(event: WheelEvent) {
		if (event.ctrlKey) {
			event.preventDefault();
			const delta = event.deltaY < 0 ? 0.1 : -0.1;
			const oldScale = this.scale;
			const newScale = oldScale + delta
		
			if (newScale > this.maxScale || newScale < this.minScale)
				return;

			this.scale = newScale
			console.log(newScale)
			console.log(this.renderQueue)


			this.pdfViewerService.currentScale = this.scale;

			// const pdfRect = this.pdfContainer.nativeElement.getBoundingClientRect()
			// const offsetX = event.clientX - pdfRect.left
			// const offsetY = event.clientY - pdfRect.top
			// const zoomFactor = newScale / oldScale;


			// this.pdfContainer.nativeElement.scrollLeft = (offsetX + this.pdfContainer.nativeElement.scrollLeft) * zoomFactor - offsetX;
			// this.pdfContainer.nativeElement.scrollTop = (offsetY + this.pdfContainer.nativeElement.scrollTop) * zoomFactor - offsetY;

			// this.pdfContainer.nativeElement.style.transformOrigin = `${event.clientX}px ${event.clientY}px`;
        	// this.pdfContainer.nativeElement.style.transform = `scale(${this.scale})`;


			for (const p of this.pdfViewerService.visiblePages.getValue()) {
				this.renderQueue.add([p, newScale]);
			}

			// this.alertService.createAlert("info", "CURRENT ZOOM",
			// 		newScale.toString(), 5000)
			this.renderTrigger.next(newScale);
		}
	}
}

import { Component, ElementRef, Input, ViewChild, ViewContainerRef, HostListener, Renderer2 } from '@angular/core';

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
import { CommonModule } from '@angular/common';
import { EntityManagerService } from '../../services/entity-manager-service';
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = "assets/pdf.worker.min.mjs";


//=======================================================================================================================
// Main Component handling the PDF logic.
//=======================================================================================================================
@Component({
	selector: 'app-pdf-viewer-component',
	imports: [CommonModule],
	templateUrl: './pdf-viewer-component.html',
	styleUrl: './pdf-viewer-component.css'
})
export class PdfViewerComponent {


	//=================================================== Private variables =================================================
	private pdfDocument: any;
	private currentPageNumber: number = 1;
	private devicePixelRatio = window.devicePixelRatio || 1;
	private scale = 1.0 * this.devicePixelRatio;
	private oldScale = this.scale
	private pageNumberSub!: Subscription;
	private alreadyRanObserver = false;
	private renderQueue = new Set<number>();
	private minScale = 0.6
	private maxScale = 10.09
	private observer: any;
	private renderTrigger = new Subject<number>();
	public mouseX = 1;
	public mouseY = 1;


	//=================================================== Public variables ==================================================
	public totalPages: number = 0;
	public pdfSrc: string | Uint8Array = ""
	public renderMode = 0 // 0 = render all pages, 1 = render 1 page

	//==================================================== Children =========================================================
	@ViewChild("pdfContainer", { static: true }) pdfContainer!: ElementRef<HTMLDivElement>;
	@ViewChild("mousePointer", { static: true }) follower!: ElementRef<HTMLDivElement>;
	@ViewChild('dynamicContainer', { read: ViewContainerRef }) dynamicContainer!: ViewContainerRef;


	//==================================================== Constructor ======================================================
	constructor(private fileService: PDFFileService, private sessionService: SessionService, private entityManagerService: EntityManagerService,
		private pdfViewerService: PDFViewerService, private textEditService: TextEditService,) {
		this.renderTrigger.pipe(debounceTime(200)).subscribe((finalScale) => {
			Promise.all(
				Array.from(this.renderQueue).map(pageNumber => {
					console.log("Re rendering page on zoom: ", pageNumber, " scale: ", finalScale)
					this.renderPage(pageNumber, false, finalScale)
				})
			).then(() => {
				this.renderQueue.clear()
			})
		});
	}


	/**
	 * Angular lifecycle hook that is called once after the component is initialized.
	 * Ideal for component setup, data fetching, and initial logic.
	 */
	async ngOnInit() {
		this.pdfViewerService.preventWindowZoomIn()
		this.loadPDF();
		this.initializeScrollEvent();
		this.subscribeToVisiblePages();
		this.pageNumberSub = this.pdfViewerService.currentPage$.subscribe(val => {
			this.currentPageNumber = val;
		});

	}
	/**
	 * Angular lifecycle hook that is called once after the component's view
	 * (and all child views) has been fully initialized.
	 * Useful for DOM-dependent logic and interacting with ViewChild elements.
	 */
	ngAfterViewInit() {
		if (this.dynamicContainer) this.pdfViewerService.setDynamicContainerRef(this.dynamicContainer)
	}

	/**
 * Angular lifecycle hook that is called just before the component is destroyed.
 * Useful for cleaning up resources such as subscriptions, intervals, or event listeners.
 */
	ngOnDestroy() {
		this.pageNumberSub.unsubscribe();
		this.observer.disconnect();
	}

	/**
	 * Handle scroll of user on the PDF. This functions sets the scroll listener and also implements page counting logic.
	 */
	initializeScrollEvent() {
		if (this.pdfContainer) {
			this.pdfViewerService.setPDFScrollContainer(this.pdfContainer);
			this.pdfViewerService.dynamicContainer = this.dynamicContainer;

			this.pdfContainer.nativeElement.addEventListener('scroll', (event) => {
				this.pdfViewerService.currentScrollTop = this.pdfContainer.nativeElement.scrollTop;
				this.currentPageNumber = this.pdfViewerService.getPageNumberFromScrolltop()
				this.pdfViewerService.setCurrentPage(this.currentPageNumber);
			})
		}
	}

	/** 
	 * The observer tells us which pages are currently visibile on the screen. Here we subscribe to the visibile pages 
	 * and render a page once it comes into the view.
	*/
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

	/**
	 * Checks if the observed pages are currently visible. If yes they are added to the VisiblePages.
	 * @param entries => these entries represent pages. We need to check if they are currently in the view.
	 */
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

	/**
	 * Creates the visible pages observer. This Observe observes all pages and tells us which pages are currently visibile
	 */
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

	/**
	 * This helper function supports the loading of the PDF pages.
	 * This function renders all pages and the creates an observer to check if the pages are currently in the view.
	 * @param file => the PDF file to load.
	 */
	loadingHelper(file: ArrayBuffer | File) {
		const pdfjs = pdfjsLib as any;
		const reader = new FileReader()
		reader.readAsArrayBuffer(new Blob([file]))

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
					this.renderPage(pageNum, true, this.scale).then(() => {
						if (this.pdfContainer.nativeElement.children.length === this.totalPages) {
							if (!this.alreadyRanObserver) this.createObserver();
						}
					});
				}
			}
		}
	}

	/**
	 * This function loads the user PDF. Depending on rendermode it loads all pages or only Page by Page.
	 * rendermode == 0 => all pages, rendermode == 1 => only 1 page.
	 * This function also makes sure that PDF is downloaded from backend if no file is specified.
	 */
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
									if (box.pageId != 0)
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



	/**
	 * This function recreates all the textboxes according to the scale
	 * @param boxesForPage => all textboxes to recreate on the page
	 * @param pageNumber => the page where the textboxes are placed
	 * @param scale => current scale of the PDF
	 * @param textBoxLayer => the parent container where the textboxes are placed.
	 */
	recreateTextBoxesForPage(boxesForPage: TextBox[], pageNumber: number,
		scale: number, textBoxLayer: HTMLDivElement) {

		boxesForPage.forEach(box => {
			if (box.pageId === pageNumber) {
				const scaleParams = this.entityManagerService.rescaleObjOnRender(box, scale)

				box.textStyleEditorState.font_size = box.textStyleEditorState.baseFontSize * scale;
				//const [left, top] = box.left, box.top //viewport.convertToViewportPoint(box.left, box.top);

				this.pdfViewerService.setCodeResizeTimeout()

				const ret = this.textEditService.createTextBox(scaleParams.dims, box.textStyleEditorState, pageNumber,
					scale, this.pdfViewerService.currentScrollTop, true, box.id)

				ret.comp.instance.positionChanged.subscribe((event: any) => this.entityManagerService.executeMove(ret.box, event, pageNumber))
				ret.box.baseHeight = scaleParams.baseHeight
				ret.box.baseWidth = scaleParams.baseWidth
				textBoxLayer.appendChild(ret.comp.location.nativeElement)
			}
		})
	}

	/**
	 * Adds a Page to the already rendered pages list.
	 * @param newPage => the page to add.
	 */
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

	/**
	 * Calculates the translation in X and Y to use when zooming in on the cursor.
	 * @param rect => parentContainer to use for offset
	 * @param translateX => translation in X
	 * @param translateY => translation in Y
	 * @param oldScale => the old Scale that was used for previous PDF page render.
	 * @param newScale => the newScale  to render the PDF page in.
	 * @returns 
	 */
	calculateZoomTranslationCss(rect: DOMRect, translateX: number = 0, translateY: number = 0,
		oldScale: number = this.oldScale, newScale: number = this.scale) {
		const pointer = {
			x: (this.mouseX - rect.left),
			y: (this.mouseY - rect.top)
		};

		const mousePointTo = {
			x: (pointer.x - translateX) / oldScale,
			y: (pointer.y - translateY) / oldScale
		};

		translateX = pointer.x - (mousePointTo.x * newScale);
		translateY = pointer.y - (mousePointTo.y * newScale);

		return { tX: translateX, tY: translateY }
	}

	/**
	 * Calculates the translation in X and Y to use when zooming in on the cursor.
	 * @param rect => parentContainer to use for offset
	 * @param translateX => translation in X
	 * @param translateY => translation in Y
	 * @param oldScale => the old Scale that was used for previous PDF page render.
	 * @param newScale => the newScale  to render the PDF page in.
	 * @returns 
	 */
	calculateZoomTranslationRender(rect: DOMRect, w: number, h: number, translateX: number = 0, translateY: number = 0,
		oldScale: number = this.oldScale, newScale: number = this.scale) {
		const pointer = {
			x: (this.mouseX - rect.left) * (w / rect.width),
			y: (this.mouseY - rect.top) * (h / rect.height)
		};

		const mousePointTo = {
			x: (pointer.x - translateX) / oldScale,
			y: (pointer.y - translateY) / oldScale
		};

		translateX = pointer.x - (mousePointTo.x * newScale);
		translateY = pointer.y - (mousePointTo.y * newScale);

		return { tX: translateX, tY: translateY }
	}


	replaceChildrenOfPageContainer(container: HTMLDivElement, renderdummy: Boolean, pageNumber: number, scale: number) {

		let { canvas, textBoxLayer, textLayer, pageContainer, canvasContainer } = this.pdfViewerService.createPageContainers(pageNumber, renderdummy, scale)
		const baseMarginScale = this.pdfViewerService.getScaledMargin(scale, pageNumber);

		const boxesForPage = this.textEditService.textboxes.filter(b => b.pageId == pageNumber)
		this.recreateTextBoxesForPage(boxesForPage, pageNumber, scale, textBoxLayer)
		const existingPageContainer = container.querySelector("#" + pageContainer.id)
		let ret;
		if (existingPageContainer != null) {
			let CanvasOld = existingPageContainer.querySelector("#" + canvasContainer.id) as HTMLDivElement
			this.recreateTextBoxesForPage(boxesForPage, pageNumber, scale, textBoxLayer)


			existingPageContainer.replaceChild(canvasContainer, CanvasOld!)

			if (!renderdummy) {
				existingPageContainer.className = "mt-1 sm:mt-3 md:mt-4 mx-auto relative block w-full max-w-fit sm:max-w-[70%] md:max-w-[90%]";
			}

			pageContainer = existingPageContainer as HTMLDivElement
		}
		else {
			container.appendChild(pageContainer);
		}
		return { canvas, textBoxLayer, textLayer, pageContainer, canvasContainer, baseMarginScale, boxesForPage } 
	}
	/**
	 * Main render function. This function is the entry point for the entire rendering logic.
	 * It handles all logic from creating the pdf canvas to recreating all objects on the PDF page itself.
	 * @param pageNumber => the page to render
	 * @param renderdummy => render a dummy page?
	 * @param scale => the scale to render the page in.
	 */
	async renderPage(pageNumber: number, renderdummy: Boolean = true, scale: number) {
		let page: any;
		let viewport: any;
		const container = this.pdfContainer.nativeElement;
		if (pageNumber === 1) renderdummy = false;

		console.log("rendering page: ", pageNumber)
		page = await this.pdfDocument.getPage(pageNumber);

		if (!renderdummy) {
			page = await this.pdfDocument.getPage(pageNumber);
			viewport = page.getViewport({ scale: scale });
			this.pdfViewerService.setPageHeight(viewport.height);
		}

		let { canvas, textBoxLayer, textLayer, pageContainer, canvasContainer, baseMarginScale, boxesForPage } = 
										this.replaceChildrenOfPageContainer(container, renderdummy, pageNumber, scale)

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
			const newPage = new Page(pageNumber, viewport, boxesForPage, viewport.height, viewport.width, 0, pageContainer, 0, 0, scale)
			this.assignPageToRendered(newPage)
		}
	}

	/**
	 * Edit the actual PDF
	 */
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

	/**
	 * Listen on Mouseclick over the entire Window. Used to determine mouse position on the document.
	 * @param event 
	 */
	@HostListener("document:mousemove", ["$event"])
	trackmouse(event: MouseEvent) {
		this.mouseX = event.pageX
		this.mouseY = event.pageY

	}

	/**
	 * This function handles the zoom on the PDF page. It adds pages that are in visibile pages to a renderqueue.
	 * @param event 
	 */
	async onWheel(event: WheelEvent) {
		if (event.ctrlKey) {
			event.preventDefault();
			const delta = event.deltaY < 0 ? 0.1 : -0.1;
			const direction = event.deltaY < 0 ? 1 : -1
			const oldScale = this.scale;
			this.oldScale = oldScale

			const zoomIntensity = 0.1; // smaller = slower acceleration
			const zoomFactor = Math.pow(1 + delta, -event.deltaY * zoomIntensity * direction);
			let newScale = oldScale * zoomFactor

			if (newScale > this.maxScale)
				newScale = this.maxScale;

			if (newScale < this.minScale)
				newScale = this.minScale;


			this.scale = newScale
			this.pdfViewerService.currentScale = this.scale;

			for (const p of this.pdfViewerService.visiblePages.getValue()) {
				this.renderQueue.add(p);

				const canvas = (event.currentTarget as HTMLDivElement).querySelector(`#canvasContainer-${p}`) as HTMLDivElement
				const page = this.pdfViewerService.getPageWithNumber(p)
				if (canvas && page) {
					const rect = ((event.currentTarget as HTMLDivElement).querySelector(`#pageContainer-${p}`) as HTMLDivElement).getBoundingClientRect();
					let ret = this.calculateZoomTranslationCss(rect, page.translateX, page.translateY, oldScale, newScale)
					page.translateX = ret.tX
					page.translateY = ret.tY

					canvas.style.transformOrigin = `0px 0px`;
					canvas.style.transition = 'transform 0.25s ease-in-out';
					canvas.style.transform = `translate(${ret.tX}px, ${ret.tY}px) scale(${this.scale})`;
					//this.cssScale = this.scale;
				}
			}

			this.renderTrigger.next(newScale);
			console.log(this.renderQueue)
		}
	}
}

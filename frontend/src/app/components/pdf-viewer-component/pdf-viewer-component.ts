import { Component, ElementRef, Input, ViewChild, ViewContainerRef } from '@angular/core';

import * as pdfjsLib from "pdfjs-dist";
import { PDFFileService } from '../../services/pdffile-service';
import { PDFViewerService } from '../../services/pdfviewer-service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TextEditService } from '../../services/text-edit-service';
import { Page } from '../../models/Page';
import { Constants } from '../../models/constants';
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = "assets/pdf.worker.min.mjs";

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
	private visiblePages = new BehaviorSubject<Set<number>>(new Set<number>());;
	private alreadyRanObserver = false;

	private currentScale = 1.0;

	private minScale = 0.6
	private maxScale = 3.0

	private observer: any;

	//=================================================== Public variables ==================================================
	public totalPages: number = 0;
	public pdfSrc: string | Uint8Array = ""
	public renderMode = 0 // 0 = render all pages, 1 = render 1 page

	//==================================================== Children =========================================================
	@ViewChild("pdfContainer", { static: true }) pdfContainer!: ElementRef<HTMLDivElement>;
	@ViewChild('dynamicContainer', { read: ViewContainerRef }) dynamicContainer!: ViewContainerRef;


	constructor(private fileService: PDFFileService, private pdfViewerService: PDFViewerService, private textEditService: TextEditService) { }

	//==================================================== Inputs ===========================================================

	addVisiblePages(pageNumber: number) {
		const current = this.visiblePages.getValue();
		current.add(pageNumber); // Add your number
		this.visiblePages.next(new Set(current));
	}

	removeVisiblePages(pageNumber: number) {
		const current = this.visiblePages.getValue();
		current.delete(pageNumber); // Remove the number
		this.visiblePages.next(new Set(current)); // Emit a new Set
	}
	//==================================================== NG ===============================================================
	async ngOnInit() {
		this.loadPDF();
		if (this.pdfContainer) {
			this.pdfViewerService.setPDFScrollContainer(this.pdfContainer);
			this.pdfViewerService.dynamicContainer = this.dynamicContainer;

			this.pdfContainer.nativeElement.addEventListener('scroll', (event) => {
				this.pdfViewerService.currentScrollTop = this.pdfContainer.nativeElement.scrollTop;
				this.currentPageNumber = this.pdfViewerService.getPageNumberFromScrolltop()
				this.pdfViewerService.setCurrentPage(this.currentPageNumber);
				if (!this.alreadyRanObserver) this.createObserver();
			})
		}

		this.pageNumberSub = this.pdfViewerService.currentPage$.subscribe(val => {
			this.currentPageNumber = val;
		});

		this.visiblePages.subscribe(set => {
			console.log("Visible pages:", Array.from(set));
			if (this.currentScale != this.scale) {
				for (const p of set)
					this.renderPage(p, false)

				this.currentScale = this.scale;
			}

		});


	}
	ngAfterViewInit() {
		if (this.dynamicContainer) this.pdfViewerService.setDynamicContainerRef(this.dynamicContainer)
	}

	getCanvasForPage(pageNumber: number) {
		const container = this.pdfContainer.nativeElement.querySelector(`#pageContainer-${pageNumber}`);
		return container
	}

	async createObserver() {

		this.alreadyRanObserver = true;
		this.observer = new IntersectionObserver(
			async entries => {
				for (const entry of entries) {
					const id = entry.target.id;
					const pageNumber = parseInt(id?.split('-')[1]);

					if (entry.isIntersecting) {
						this.addVisiblePages(pageNumber)
						if (!this.pdfViewerService.allRenderedPages.find(p => p.pageNum === pageNumber))
							this.renderPage(pageNumber, false)

					}
					else {
						this.removeVisiblePages(pageNumber)
					}
				}
				console.log("Current Visbile Pages", this.visiblePages);
			},
			{
				root: this.pdfContainer.nativeElement,
				threshold: 0.01 // Trigger if at least 10% is visible
			}
		);

		requestAnimationFrame(() => {
			for (let i = 1; i <= this.totalPages; i++) {
				const pageContainer = this.getCanvasForPage(i);
				if (pageContainer) this.observer.observe(pageContainer);
			}
		});
	}

	ngOnDestroy() {
		this.pageNumberSub.unsubscribe();
	}

	//==================================================== Methods ==========================================================
	async loadPDF() {
		try {
			const pdfjs = pdfjsLib as any;

			let file = this.fileService.getFile()!
			const reader = new FileReader()
			reader.readAsArrayBuffer(file)

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
						this.renderPage(pageNum, true);
					}
				}

			}
		} catch (error) {
			console.error("Error loading PDF:", error);
		}
	}


	getScaledMargin(scale: number) {
		if (scale === 1.0) return 16;
		let scaler = 0.1

		if (scale > 1.2)
			scaler += 0.1
		if (scale > 1.9)
			scaler += 0.1

		const fract = scale - Math.floor(scale)
		const fractFull = (Math.floor(scale) - 1) + fract


		const multiplier = 10 + ((fractFull - scaler) * 10)
		const marginOffset = fractFull * multiplier;
		return 16 * (8 * marginOffset);
	}


	// Render a specific page of the PDF.
	async renderPage(pageNumber: number, renderdummy: Boolean = true) {


		let page: any;
		let viewport: any;
		// if (pageNumber === 1)
		// 	renderdummy = false;

		console.log("Rendering correct page: ", renderdummy)

		page = await this.pdfDocument.getPage(pageNumber);

		if (!renderdummy) {
			page = await this.pdfDocument.getPage(pageNumber);
			viewport = page.getViewport({ scale: this.scale });
			this.pdfViewerService.setPageHeight(viewport.height);
		}

		const container = this.pdfContainer.nativeElement;
		const canvas = document.createElement("canvas");
		const text_layer = document.createElement("div");
		let pageContainer = document.createElement("div");

		canvas.id = `page-${pageNumber}`;
		pageContainer.id = `pageContainer-${pageNumber}`;
		text_layer.className = "text-layer"


		// scale margin top
		let baseMarginScale = 16
		if (this.scale > 1.0 && pageNumber > 1) baseMarginScale = this.getScaledMargin(this.scale)

		if (!renderdummy) {
			pageContainer.className = "mt-4 mx-auto relative block w-fit";
			canvas.className = `page-${pageNumber} border border-gray-300 shadow-lg mx-auto`;

		}
		else {
			pageContainer.className = `mt-4 mx-auto relative block w-fit h-[900px]`;
			canvas.className = `page-${pageNumber} border border-gray-300 shadow-lg  h-[841.92px] w-[595.32px]`;
		}

		const boxesForPage = this.textEditService.textboxes.filter(b => b.pageId == pageNumber)



		pageContainer.appendChild(text_layer)
		pageContainer.appendChild(canvas)
		const exists = container.querySelector("#" + pageContainer.id)
		if (exists != null) {
			const textOld = exists.querySelector(Constants.OVERLAY_TEXT)
			const CanvasOld = exists.querySelector("#" + canvas.id)

			const span = document.createElement("span")
			span.textContent = "ASDASDASDASDASDASDASDSD";
			span.className = "bg-red-500 text-[42px]"

			boxesForPage.forEach(box => {
				if (box.pageId === pageNumber) {
					const box_dims = {top: box.top * this.scale, 
									  left: box.left  * this.scale, 
									  width: box.width * this.scale, 
									  height:  box.height * this.scale}

					box.textStyleEditorState.font_size = box.textStyleEditorState.baseFontSize * this.scale;
					//const [left, top] = box.left, box.top //viewport.convertToViewportPoint(box.left, box.top);
					const textBoxComp = this.textEditService.createTextBox(box_dims, box.textStyleEditorState, pageNumber, 
						this.scale, this.pdfViewerService.currentScrollTop, true)
					text_layer.appendChild(textBoxComp.location.nativeElement)
				}
			})

			const [x, y] = viewport.convertToViewportPoint(500, 600);
			span.style.position = "absolute";
			span.style.left = `${x}px`; // Already scaled by viewport
			span.style.top = `${y}px`;

			span.style.fontSize = `${12 * this.scale}px`;
			text_layer.appendChild(span)
			exists.replaceChild(text_layer, textOld!)
			exists.replaceChild(canvas, CanvasOld!)

			if (!renderdummy) {
				exists.className = "mt-4 mx-auto relative block w-fit";
			}

			pageContainer = exists as HTMLDivElement
		}
		else {
			container.appendChild(pageContainer);
		}

		if (!renderdummy) {
			const context = canvas.getContext("2d")!;
			canvas.height = viewport.height;
			canvas.width = viewport.width;

			// pageContainer.style.marginTop = `${baseMarginScale}px`;
			// pageContainer.style.width = `${viewport.width}px`;
			// pageContainer.style.height = `${viewport.height}px`;

			const renderContext = {
				canvasContext: context,
				viewport: viewport,
				intent: "print"
			};

			await page.render(renderContext).promise;
			const newPage = new Page(pageNumber, viewport, boxesForPage, viewport.height, viewport.width, 0, pageContainer)
			const renderedPage = this.pdfViewerService.allRenderedPages.find(p => p.pageNum === pageNumber)
			if (renderedPage) {
				const idx = this.pdfViewerService.allRenderedPages.indexOf(renderedPage);

				this.pdfViewerService.allRenderedPages.splice(idx, 1, newPage);
			}
			else
				this.pdfViewerService.allRenderedPages.push(newPage)
		}

	}

	public onWheel(event: WheelEvent) {
		if (event.ctrlKey) {
			event.preventDefault();
			if (event.deltaY < 0 && this.scale < this.maxScale) {
				this.scale += 0.1;
				for (const p of this.visiblePages.getValue())
					this.renderPage(p, false)
			}
			else if (this.scale > this.minScale && event.deltaY > 0) {
				this.scale -= 0.1;
				for (const p of this.visiblePages.getValue())
					this.renderPage(p, false)

			}
			this.pdfViewerService.currentScale = this.scale;

		}
	}
}

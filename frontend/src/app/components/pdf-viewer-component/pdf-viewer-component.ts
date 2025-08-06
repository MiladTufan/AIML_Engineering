import { Component, ElementRef, Input, ViewChild, ViewContainerRef } from '@angular/core';

import * as pdfjsLib from "pdfjs-dist";
import { PDFFileService } from '../../services/pdffile-service';
import { PDFViewerService } from '../../services/pdfviewer-service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TextEditService } from '../../services/text-edit-service';
import { Page } from '../../models/Page';
import { Constants } from '../../models/constants';
import { debounceTime, Subject } from 'rxjs';

// import { TextLayerBuilder } from 'pdfjs-dist'; 
import 'pdfjs-dist/web/pdf_viewer.css'; // <-- required for text layer positioning
import { AlertService } from '../../services/alert-service';

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
	private renderQueue = new Set<number[]>();

	private currentScale = 1.0;

	private minScale = 0.6
	private maxScale = 3.0

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


	constructor(private fileService: PDFFileService,
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
		window.addEventListener('wheel', (event) => {
			if (event.ctrlKey) {
				event.preventDefault();
			}
		}, { passive: false });
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

			for (const pageNum of set) {
				const page = this.pdfViewerService.allRenderedPages.find(p => p.pageNum === pageNum)
				if (page?.currentScale != this.scale) {
					this.renderPage(pageNum, false, this.scale)
					console.log("re-rendering page: ", pageNum)
				}
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
							this.renderPage(pageNumber, false, this.scale)

					}
					else {
						this.removeVisiblePages(pageNumber)
					}
				}
			},
			{
				root: this.pdfContainer.nativeElement,
				rootMargin: '200px 0px 200px 0px', // top, right, bottom, left
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
		this.observer.disconnect();
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
						this.renderPage(pageNum, true, this.scale);
					}
				}

			}
		} catch (error) {
			console.error("Error loading PDF:", error);
		}
	}


	getScaledMargin(scale: number) {
		if (scale === 1.0) return 16;

		const fract = scale - Math.floor(scale)
		const fractFull = (Math.floor(scale) - 1) + fract


		const multiplier = 10
		const marginOffset = fractFull * multiplier;
		return 16 * (marginOffset);
	}


	// Render a specific page of the PDF.
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
		const canvas = document.createElement("canvas");
		const text_box_layer = document.createElement("div");
		let text_layer = document.createElement("div");
		let pageContainer = document.createElement("div");

		canvas.id = `page-${pageNumber}`;
		pageContainer.id = `pageContainer-${pageNumber}`;
		text_box_layer.className = "text-box-layer"


		// scale margin top
		let baseMarginScale = 16
		if (scale > 1.0 && pageNumber > 1) baseMarginScale = this.getScaledMargin(scale)

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

		const boxesForPage = this.textEditService.textboxes.filter(b => b.pageId == pageNumber)



		pageContainer.appendChild(text_box_layer)
		pageContainer.appendChild(canvas)
		const exists = container.querySelector("#" + pageContainer.id)
		if (exists != null) {
			const textOld = exists.querySelector(Constants.OVERLAY_TEXT)
			const CanvasOld = exists.querySelector("#" + canvas.id)
			boxesForPage.forEach(box => {
				if (box.pageId === pageNumber) {

					let newBaseWidth = box.baseWidth;
					let newBaseHeight = box.baseHeight;
					const diff = Math.floor(box.BoxDims.width) - Math.floor(box.BoxDims.resizedWidth)
					const condition = (diff != 0)
					if (condition) {
						newBaseWidth = box.BoxDims.resizedWidth;
						newBaseHeight = box.BoxDims.resizedHeight;
					}

					const finalWidth = condition ? newBaseWidth : newBaseWidth * scale
					const finalHeight = condition ? newBaseHeight : newBaseHeight * scale

					const box_dims = {
						top: box.baseTop * (scale / box.BoxDims.creationScale),
						left: box.baseLeft * (scale / box.BoxDims.creationScale),
						width: finalWidth,
						height: finalHeight,
						resizedHeight: newBaseHeight,
						resizedWidth: newBaseWidth,
						currentScale: scale,
						creationScale: box.BoxDims.creationScale,
					}

					box.textStyleEditorState.font_size = box.textStyleEditorState.baseFontSize * scale;
					//const [left, top] = box.left, box.top //viewport.convertToViewportPoint(box.left, box.top);
					const ret = this.textEditService.createTextBox(box_dims, box.textStyleEditorState, pageNumber,
						scale, this.pdfViewerService.currentScrollTop, true, box.id)

					ret.box.baseHeight = newBaseHeight
					ret.box.baseWidth = newBaseWidth
					text_box_layer.appendChild(ret.comp.location.nativeElement)
				}
			})

			exists.replaceChild(text_box_layer, textOld!)
			exists.replaceChild(canvas, CanvasOld!)

			if (!renderdummy) {
				exists.className = "mt-1 sm:mt-3 md:mt-4 mx-auto relative block w-full max-w-fit sm:max-w-[70%] md:max-w-[90%]";
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
			const renderedPage = this.pdfViewerService.allRenderedPages.find(p => p.pageNum === pageNumber)
			if (renderedPage) {
				const idx = this.pdfViewerService.allRenderedPages.indexOf(renderedPage);

				this.pdfViewerService.allRenderedPages.splice(idx, 1, newPage);
			}
			else
				this.pdfViewerService.allRenderedPages.push(newPage)


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

	}

	// Example: Highlight all occurrences of a word
	highlightWords(divs: HTMLDivElement[], keyword: string) {
		divs.forEach(div => {
			if (div.textContent?.toLowerCase().includes(keyword.toLowerCase())) {
				div.style.backgroundColor = 'yellow';
			}
		});
	}

	// async onWheel(event: WheelEvent) {
	// 	if (event.ctrlKey) {
	// 		event.preventDefault();
	// 		if (event.deltaY < 0 && this.scale < this.maxScale) {
	// 			this.scale += 0.1;
	// 			for (const p of this.visiblePages.getValue())
	// 			{
	// 				console.log("rendering page:", p, "for scale: ", this.scale);
	// 				await this.renderPage(p, false)
	// 			}
	// 			this.pdfViewerService.currentScale = this.scale;
	// 		}
	// 		else if (this.scale > this.minScale && event.deltaY > 0) {
	// 			this.scale -= 0.1;
	// 			for (const p of this.visiblePages.getValue())
	// 			{
	// 				console.log("rendering page:", p, "for scale: ", this.scale);
	// 				await this.renderPage(p, false)

	// 			}

	// 			this.pdfViewerService.currentScale = this.scale;
	// 		}


	// 	}
	// }


	async onWheel(event: WheelEvent) {
		if (event.ctrlKey) {
			event.preventDefault();
			const delta = event.deltaY < 0 ? 0.1 : -0.1;
			const oldScale = this.scale;
			const newScale = oldScale + delta

			if (newScale > this.maxScale || newScale < this.minScale)
				return;

			this.scale = newScale


			this.pdfViewerService.currentScale = this.scale;

			// const pdfRect = this.pdfContainer.nativeElement.getBoundingClientRect()
			// const offsetX = event.clientX - pdfRect.left
			// const offsetY = event.clientY - pdfRect.top

			// // Adjust transform-origin to zoom into cursor
			// const originX = offsetX + 'px';
			// const originY = offsetY + 'px';
			// this.transformOrigin = `${originX} ${originY}`;


			// this.cssScale = `scale(${this.scale})`;


			for (const p of this.visiblePages.getValue()) {
				this.renderQueue.add([p, newScale]);
			}

			// this.alertService.createAlert("info", "CURRENT ZOOM",
			// 		newScale.toString(), 5000)
			this.renderTrigger.next(newScale);
		}
	}
}

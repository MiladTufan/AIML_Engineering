import { Component, ElementRef, Input, ViewChild } from '@angular/core';

import * as pdfjsLib from "pdfjs-dist";
import { PDFFileService } from '../../services/pdffile-service';
import { PDFViewerService } from '../../services/pdfviewer-service';
import { Subscription } from 'rxjs';
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
	private visiblePages = new Set<number>();
	private renderedPages = new Set<number>();
	private alreadyRanObserver = false;

	//=================================================== Public variables ==================================================
	public totalPages: number = 0;
	public pdfSrc: string | Uint8Array = ""
	public renderMode = 0 // 0 = render all pages, 1 = render 1 page

	//==================================================== Children =========================================================
	@ViewChild("pdfContainer", { static: true }) pdfContainer!: ElementRef<HTMLDivElement>;


	constructor(private fileService: PDFFileService, private pdfViewerService: PDFViewerService) { }

	//==================================================== Inputs ===========================================================

	//==================================================== NG ===============================================================
	async ngOnInit() {
		await this.loadPDF();
		if (this.pdfContainer) {
			this.pdfViewerService.setPDFScrollContainer(this.pdfContainer);
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

	}

	getPageContainer(pageNumber: number) {
		const container = this.pdfContainer.nativeElement.querySelector(`#pageContainer-${pageNumber}`);
		return container;
	}

	async createObserver() {
		console.log("called Observer")
		this.alreadyRanObserver = true;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const id = entry.target.id;
					const pageNumber = parseInt(id?.split('-')[1]);

					if (entry.isIntersecting) {
						this.visiblePages.add(pageNumber);
						this.rerenderPageOnZoom(pageNumber)
						observer.unobserve(entry.target);
					} else {
						this.visiblePages.delete(pageNumber);
					}
				}

				console.log('Visible pages:', Array.from(this.visiblePages));
			},
			{
				root: this.pdfContainer.nativeElement,
				threshold: 0.01 // Trigger if at least 10% is visible
			}
		);

		let pages: any[] = []
		for(let i = 1; i <= this.totalPages; i++)
		{
			pages.push(this.getPageContainer(i))
		}
		pages.forEach((page: Element) => observer.observe(page));
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

	async unrenderPage(pageNumber: number) {
		const page = await this.pdfDocument.getPage(pageNumber);
		const viewport = page.getViewport({ scale: this.scale });

		const container = this.pdfContainer.nativeElement;
		const canvas = document.createElement("canvas");
		const text_layer = document.createElement("div");
		const pageContainer = document.createElement("div");
		pageContainer.className = "mt-4 mx-auto relative block w-fit h-[900px]";
		pageContainer.id = `pageContainer-${pageNumber}`;
		text_layer.className = "text-layer"

		canvas.className = `page-${pageNumber} border border-gray-300 shadow-lg mt-4 mx-auto  h-[900px] w-[600px]`;
		canvas.id = `page-${pageNumber}`;
		canvas.appendChild(text_layer);

		pageContainer.appendChild(text_layer)
		pageContainer.appendChild(canvas)

		const oldPage = container.querySelector("#" + pageContainer.id)
		const correctCanvas = oldPage?.querySelector("#" + canvas.id)

		if (oldPage && oldPage.parentNode && correctCanvas) {
			oldPage.parentNode.replaceChild(pageContainer, oldPage)
		}
	}

	async rerenderPageOnZoom(pageNumber: number) {
		const page = await this.pdfDocument.getPage(pageNumber);
		const viewport = page.getViewport({ scale: this.scale });

		const container = this.pdfContainer.nativeElement;
		const canvas = document.createElement("canvas");
		const text_layer = document.createElement("div");
		const pageContainer = document.createElement("div");
		pageContainer.className = "mt-4 mx-auto relative block w-fit";
		pageContainer.id = `pageContainer-${pageNumber}`;
		text_layer.className = "text-layer"

		canvas.className = `page-${pageNumber} border border-gray-300 shadow-lg mt-4 mx-auto`;
		canvas.id = `page-${pageNumber}`;
		canvas.appendChild(text_layer);

		pageContainer.appendChild(text_layer)
		pageContainer.appendChild(canvas)


		const oldPage = container.querySelector("#" + pageContainer.id)
		const correctCanvas = oldPage?.querySelector("#" + canvas.id)

		if (oldPage && oldPage.parentNode && correctCanvas) {
			oldPage.parentNode.replaceChild(pageContainer, oldPage)
		}

		const context = canvas.getContext("2d")!;
		canvas.height = viewport.height;
		canvas.width = viewport.width;

		const renderContext = {
			canvasContext: context,
			viewport: viewport,
			intent: "print"
		};

		this.pdfViewerService.setPageHeight(viewport.height);

		await page.render(renderContext).promise;
		this.renderedPages.add(pageNumber)
	}

	// Render a specific page of the PDF.
	async renderPage(pageNumber: number, renderdummy: Boolean = true) {
		let page: any;
		let viewport: any;
		if (pageNumber === 1)
			renderdummy = false;

		page = await this.pdfDocument.getPage(pageNumber);

		if (!renderdummy)
		{
			page = await this.pdfDocument.getPage(pageNumber);
			viewport = page.getViewport({ scale: this.scale });
			this.pdfViewerService.setPageHeight(viewport.height);
		}

		const container = this.pdfContainer.nativeElement;
		const canvas = document.createElement("canvas");
		const text_layer = document.createElement("div");
		const pageContainer = document.createElement("div");
		if (!renderdummy)
		{
			pageContainer.className = "mt-4 mx-auto relative block w-fit";
			canvas.className = `page-${pageNumber} border border-gray-300 shadow-lg mt-4 mx-auto`;

		}
		else
		{
			pageContainer.className = `mt-4 mx-auto relative block w-fit h-[900px]`;
			canvas.className = `page-${pageNumber} border border-gray-300 shadow-lg mt-4  h-[900px] w-[600px]`;
		}
			
		pageContainer.id = `pageContainer-${pageNumber}`;
		text_layer.className = "text-layer"

		
		canvas.id = `page-${pageNumber}`;
		canvas.appendChild(text_layer);

		pageContainer.appendChild(text_layer)
		pageContainer.appendChild(canvas)

		container.appendChild(pageContainer);

		if (!renderdummy)
		{
			const context = canvas.getContext("2d")!;
			canvas.height = viewport.height;
			canvas.width = viewport.width;

			const renderContext = {
				canvasContext: context,
				viewport: viewport,
				intent: "print"
			};

			await page.render(renderContext).promise;
		}

	}

	public onWheel(event: WheelEvent) {
		if (event.ctrlKey) {
			event.preventDefault();
			if (event.deltaY < 0) {
				this.scale += 0.1;
				this.rerenderPageOnZoom(this.currentPageNumber)
			}
			else {
				this.scale -= 0.1;
				this.rerenderPageOnZoom(this.currentPageNumber)
			}
		}
	}

}

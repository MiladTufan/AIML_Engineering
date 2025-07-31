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
	//=================================================== Public variables ==================================================
	public totalPages: number = 0;
	public pdfSrc: string | Uint8Array = ""
	public renderMode = 0 // 0 = render all pages, 1 = render 1 page

	//==================================================== Children =========================================================
	@ViewChild("pdfContainer", { static: true }) pdfContainer!: ElementRef<HTMLDivElement>;


	constructor(private fileService: PDFFileService, private pdfViewerService: PDFViewerService) { }

	//==================================================== Inputs ===========================================================

	//==================================================== NG ===============================================================
	ngOnInit() {
		this.loadPDF();
		if (this.pdfContainer) {
			this.pdfViewerService.setPDFScrollContainer(this.pdfContainer);
			this.pdfContainer.nativeElement.addEventListener('scroll', (event) => {
				this.pdfViewerService.currentScrollTop = this.pdfContainer.nativeElement.scrollTop;
				if (this.pdfViewerService.currentScrollTop > (this.pdfViewerService.pageHeight * this.currentPageNumber))
				{
					this.currentPageNumber++;
					this.pdfViewerService.setCurrentPage(this.currentPageNumber)
				}
			})
		}

		this.pageNumberSub = this.pdfViewerService.currentPage$.subscribe(val => {
			this.currentPageNumber = val;
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
						this.renderPage(pageNum);
					}
				}
			}
		} catch (error) {
			console.error("Error loading PDF:", error);
		}
	}

	async rerenderPageOnZoom(pageNumber: number)
	{
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

		
		const oldPage = container.querySelector("#"+pageContainer.id)
		const correctCanvas = oldPage?.querySelector("#"+canvas.id)

		if (oldPage && oldPage.parentNode && correctCanvas)
		{
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
		
	}

	// Render a specific page of the PDF.
	async renderPage(pageNumber: number) {
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

		container.appendChild(pageContainer);

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
	}

	public onWheel(event: WheelEvent)
	{
		if (event.ctrlKey) {
			event.preventDefault();
			if (event.deltaY < 0)
			{
				this.scale += 0.25;
				this.rerenderPageOnZoom(this.currentPageNumber)
			}
			else
			{
				this.scale -= 0.25;
				this.rerenderPageOnZoom(this.currentPageNumber)
			}
		}
	}

}

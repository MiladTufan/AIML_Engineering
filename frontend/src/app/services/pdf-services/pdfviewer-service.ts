import { ElementRef, Injectable, ViewContainerRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Page } from '../../models/Page';
import { PageInfoComponent } from '../../components/pdf-components/page-info-component/page-info-component';

@Injectable({
	providedIn: 'root'
})
export class PDFViewerService {
	private _currentPage = new BehaviorSubject<number>(1);

	public visiblePages = new BehaviorSubject<Set<number>>(new Set<number>());
	public standardMarginTop = 64;
	public totalPages: number = 0;
	public currentScrollTop: number = 0;
	public pageHeight: number = 0;
	public PDFScrollContainer: ElementRef | null = null;
	public dynamicContainer: ViewContainerRef | null = null;
	public currentScale: number = 1.0;
	public currentBaseMarginScale: number = 1.0;
	public allPageContainers: any
	public allRenderedPages: Page[] = []
	public ignoreResizeTimeout: any = null;


	public currentPage$ = this._currentPage.asObservable();


	//=======================================================================================================================
	// Set the total number of pages a pdf has.
	//=======================================================================================================================
	setTotalPages(totalPages: number) {
		this.totalPages = totalPages;
	}

	//=======================================================================================================================
	// Set the current page the pdfviewer shows.
	//=======================================================================================================================
	setCurrentPage(currPage: number) {
		this._currentPage.next(currPage);
	}

	//=======================================================================================================================
	// Set the current height of each page.
	//=======================================================================================================================
	setPageHeight(height: number) {
		this.pageHeight = height;
	}

	//=======================================================================================================================
	// Set the scroll container the pdf is in.
	//=======================================================================================================================
	setPDFScrollContainer(scrollContainer: ElementRef) {
		this.PDFScrollContainer = scrollContainer;
	}

	//=======================================================================================================================
	// Set the dynamic container which is used to instantiate the dynamic objects like textboxes on to the pdf.
	//=======================================================================================================================
	setDynamicContainerRef(vcr: ViewContainerRef) {
		this.dynamicContainer = vcr;
	}

	//=======================================================================================================================
	// Get a PDF page with a certain pageNumber.
	//=======================================================================================================================
	getPageWithNumber(pageNumber: number) {
		const page = this.allRenderedPages.find(p => p.pageNum == pageNumber)
		return page
	}

	//=======================================================================================================================
	// Get the canvas where the actual PDF page is printed in.
	//=======================================================================================================================
	getCanvasForPageContainer(pageContainer: any, pageNumber: number) {
		return pageContainer.querySelector(`#page-${pageNumber}`)
	}

	getCanvasForPage(pageNumber: number) {
		const container = this.PDFScrollContainer!.nativeElement.querySelector(`#pageContainer-${pageNumber}`);
		return container
	}

	//=======================================================================================================================
	// Calculate the current Pagenumber from the scrolltop of the user. The scrolltop is the top of the PDF scrollcontainer.
	// If it reaches the current pageheight then a new page begins. This function checks whether a certain scrolltop is 
	// between two page heights (e.g. pageheight of page 1 is 800 and pageheight of page 2 is 1600) is scrolltop is between
	// 800 and 1600 then the current page is 2.
	//=======================================================================================================================
	getPageNumberFromScrolltop(scrolltop: number | null = null) {
		let pageNum: number = this.totalPages;
		if (scrolltop === null) scrolltop = this.currentScrollTop;

		for (let i = 1; i < this.totalPages; i++) {
			const firsCmp = ((i - 1) * (this.pageHeight))
			const scndCmp = ((i) * (this.pageHeight))
			if (scrolltop >= firsCmp && scrolltop <= scndCmp) {
				pageNum = i;
				break;
			}
		}
		return pageNum;
	}

	//=======================================================================================================================
	// calculate the target scrolltop of a certain page. 
	//=======================================================================================================================
	calcTargetScrolltop(pageNumber: number) {
		return (pageNumber - 1) * (this.pageHeight + 17);
	}

	//=======================================================================================================================
	// This function adjusts the current scrolltop to jump to a certain page.
	//=======================================================================================================================
	scrollToPage(pageNumber: number) {
		console.log("Jump to page: ", pageNumber);
		const targetScrolltop = this.calcTargetScrolltop(pageNumber);
		this.PDFScrollContainer!.nativeElement.scrollTop = targetScrolltop;
		// this.PDFScrollContainer!.nativeElement.scroll({top: targetScrolltop, bevahior: 'smooth'})
	}

	//=======================================================================================================================
	// This function is used to add a page to the currently visible pages.
	//======================================================================================================================
	addVisiblePages(pageNumber: number) {
		const current = this.visiblePages.getValue();
		current.add(pageNumber); // Add your number
		this.visiblePages.next(new Set(current));
	}

	//=======================================================================================================================
	// This function is used to remove a page from the currently visible pages.
	//======================================================================================================================
	removeVisiblePages(pageNumber: number) {
		const current = this.visiblePages.getValue();
		current.delete(pageNumber); // Remove the number
		this.visiblePages.next(new Set(current)); // Emit a new Set
	}

	//=======================================================================================================================
	// This function prevents the user to use browser zoom on ctrl. We need this because we implement our custom zoom.
	//======================================================================================================================
	preventWindowZoomIn() {
		window.addEventListener('wheel', (event) => {
			if (event.ctrlKey) {
				event.preventDefault();
			}
		}, { passive: false });
	}

	//=======================================================================================================================
	// This function sets a timeout on code resizing. During that time ResizeObserver does not register textbox resizing.
	//=======================================================================================================================
	setCodeResizeTimeout() {
		if (this.ignoreResizeTimeout) {
			clearTimeout(this.ignoreResizeTimeout);
		}
		this.ignoreResizeTimeout = setTimeout(() => {
			this.ignoreResizeTimeout = null;
		}, 400);
	}

	/**
	 * Get the Margin top between the pages on PDF page rerender. 
	 * This function calculates the margin between two pages on zoom. This is necessary since on zoom margin behaves differently.
	 * @param scale => the current scale
	 * @param pageNumber => the current page.
	 * @returns 
	 */
	getScaledMargin(scale: number, pageNumber: number) {
		let baseMarginScale = 16
		if (scale > 1.0 && pageNumber > 1) {
			const fract = scale - Math.floor(scale)
			const fractFull = (Math.floor(scale) - 1) + fract
			const multiplier = 10
			const marginOffset = fractFull * multiplier;
			baseMarginScale =  16 * (marginOffset);
		}

		return baseMarginScale;
	}

	/**
	 * This function creates all the necessary containers to render a page. That includes the pageContainer, the canvas 
	 * for the actual page and any layers on top of the page e.g. textBoxLayer (where all textboxes reside).
	 * @param pageNumber => the current number of the page to create the containers for
	 * @param renderdummy => render a full page or a dummy one?
	 * @param scale => the current scale of the PDF.
	 * @returns 
	 */
	createPageContainers(pageNumber: number, renderdummy: Boolean, scale: number) {
		const canvas = document.createElement("canvas");
		const textBoxLayer = document.createElement("div");
		const imgBoxLayer = document.createElement("div");

		let textLayer = document.createElement("div");
		let pageContainer = document.createElement("div");
		const canvasContainer = document.createElement("div");

		const pageInfo = this.dynamicContainer?.createComponent(PageInfoComponent);
		pageInfo!.instance.pageNumber = pageNumber;
		pageInfo!.instance.width = 30 * scale;
		pageInfo!.instance.fontSize = 16 * scale;
		pageInfo!.instance.borderRadius = 6 * scale;

		canvas.id = `page-${pageNumber}`;
		canvasContainer.id = `canvasContainer-${pageNumber}`;

		canvasContainer.style.display = "flex";
		canvasContainer.style.gap = "8px";

		pageContainer.id = `pageContainer-${pageNumber}`;
		textBoxLayer.className = "text-box-layer"
		imgBoxLayer.className = "img-box-layer"

		if (!renderdummy) {
			pageContainer.className = "mt-1 sm:mt-3 md:mt-4 mx-auto relative block w-full max-w-fit sm:max-w-[70%] md:max-w-[90%]";
			if (scale == 1.0)
				canvas.className = `page-${pageNumber} block border border-gray-300 shadow-lg -mb-[305px]`;
			else
				canvas.className = `page-${pageNumber} block border border-gray-300 shadow-lg`;
		}
		else {
			pageContainer.className = `mt-1 sm:mt-3 md:mt-4 mx-auto relative block w-full max-w-fit sm:max-w-[70%] md:max-w-[90%]`;
			canvas.className = `page-${pageNumber} block border border-gray-300 shadow-lg mx-auto`;
		}

		canvasContainer.appendChild(imgBoxLayer)
		canvasContainer.appendChild(textBoxLayer)
		canvasContainer.appendChild(canvas)
		canvasContainer.appendChild(pageInfo!.location.nativeElement)

		pageContainer.appendChild(canvasContainer)

		return { canvas: canvas, textBoxLayer: textBoxLayer, textLayer: textLayer, 
				 pageContainer: pageContainer, canvasContainer: canvasContainer, imgBoxLayer: imgBoxLayer }
	}
}

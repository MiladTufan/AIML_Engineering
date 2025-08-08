import { ElementRef, Injectable, ViewContainerRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Page } from '../models/Page';

@Injectable({
	providedIn: 'root'
})
export class PDFViewerService {
	private _currentPage = new BehaviorSubject<number>(1);

	public visiblePages = new BehaviorSubject<Set<number>>(new Set<number>());
	public totalPages: number = 0;
	public currentScrollTop: number = 0;
	public pageHeight: number = 0;
	public PDFScrollContainer: ElementRef | null = null;
	public dynamicContainer: ViewContainerRef | null = null;
	public currentScale: number = 1.0;
	public currentBaseMarginScale: number = 1.0;
	public allPageContainers: any
	public allRenderedPages: Page[] = []


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

	preventWindowZoomIn()
	{
		window.addEventListener('wheel', (event) => {
			if (event.ctrlKey) {
				event.preventDefault();
			}
		}, { passive: false });
	}
}

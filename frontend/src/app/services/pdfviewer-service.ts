import { ElementRef, Injectable, ViewContainerRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Page } from '../models/Page';

@Injectable({
	providedIn: 'root'
})
export class PDFViewerService {
	public totalPages: number = 0;
	private _currentPage = new BehaviorSubject<number>(1);
	public currentScrollTop: number = 0;
	public pageHeight: number = 0;
	public PDFScrollContainer: ElementRef | null = null;
	public dynamicContainer: ViewContainerRef | null = null;
	public currentScale: number = 1.0;
	public currentBaseMarginScale: number = 1.0;
	public allPageContainers: any
	public allRenderedPages: Page[] = []

	public currentPage$ = this._currentPage.asObservable();

	setTotalPages(totalPages: number) {
		this.totalPages = totalPages;
	}
	setCurrentPage(currPage: number) {
		this._currentPage.next(currPage);
	}

	setPageHeight(height: number) {
		this.pageHeight = height;
	}

	setPDFScrollContainer(scrollContainer: ElementRef) {
		this.PDFScrollContainer = scrollContainer;
	}

	setDynamicContainerRef(vcr: ViewContainerRef) {
		this.dynamicContainer = vcr;
	}

	getPageWithNumber(pageNumber: number)
	{
		const page = this.allRenderedPages.find(p => p.pageNum == pageNumber)
		return page
	}
	getCanvasForPageContainer(pageContainer: any, pageNumber: number)
	{
		return pageContainer.querySelector(`#page-${pageNumber}`)
	}

	getPageNumberFromScrolltop(scrolltop: number | null = null) {
		let pageNum: number = this.totalPages;
		if (scrolltop === null) scrolltop = this.currentScrollTop;

		for (let i = 1; i < this.totalPages; i++) {	// e.g. check if it between scrollTop of page 1 and scrolltop of page 2 ==> current page is 1
			const firsCmp = ((i - 1) * (this.pageHeight))
			const scndCmp = ((i) * (this.pageHeight))
			if (scrolltop >= firsCmp && scrolltop <= scndCmp) {
				pageNum = i;
				break;
			}
		}
		return pageNum;
	}

	calcTargetScrolltop(pageNumber: number) {
		return (pageNumber - 1) * (this.pageHeight + 17);
	}

	scrollToPage(pageNumber: number) {
		console.log("Jump to page: ", pageNumber);
		const targetScrolltop = this.calcTargetScrolltop(pageNumber);
		this.PDFScrollContainer!.nativeElement.scrollTop = targetScrolltop;
		// this.PDFScrollContainer!.nativeElement.scroll({top: targetScrolltop, bevahior: 'smooth'})
	}
}

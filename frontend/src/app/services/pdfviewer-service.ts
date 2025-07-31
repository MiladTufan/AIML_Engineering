import { ElementRef, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class PDFViewerService {
	public totalPages: number = 0;
	private _currentPage = new BehaviorSubject<number>(1);
	public currentScrollTop: number = 0;
	public pageHeight: number = 0;
	public PDFScrollContainer: ElementRef | null = null;

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

	setPDFScrollContainer(scrollContainer: ElementRef)
	{
		this.PDFScrollContainer = scrollContainer;
	}

	scrollToPage(pageNumber: number)
	{
		console.log("Jump to page: ", pageNumber);
		const targetScrolltop = (pageNumber - 1) * (this.pageHeight + 17);
		this.PDFScrollContainer!.nativeElement.scrollTop = targetScrolltop;
		// this.PDFScrollContainer!.nativeElement.scroll({top: targetScrolltop, bevahior: 'smooth'})
	}
}

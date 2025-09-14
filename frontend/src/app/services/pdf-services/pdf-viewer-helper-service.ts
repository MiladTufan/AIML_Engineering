import { Injectable } from '@angular/core';
import { Page } from '../../models/Page';

@Injectable({
  providedIn: 'root',
})
export class PdfViewerHelperService {
  public allRenderedPages: Page[] = [];
  public currentScale: number = 1.0;

  /**
   * Get a PDF page with a certain pageNumber.
   * @param pageNumber => Page to get.
   * @returns
   */
  getPageWithNumber(pageNumber: number) {
    const page = this.allRenderedPages.find((p) => p.pageNum == pageNumber);
    return page;
  }

  /**
   * Adds a Page to the already rendered pages list.
   * @param newPage => the page to add.
   */
  //=======================================================================================================================
  // This function assigns a Page to the alreadyRenderedPages
  //=======================================================================================================================
  assignPageToRendered(newPage: Page) {
    const renderedPage = this.allRenderedPages.find(
      (p) => p.pageNum === newPage.pageNum,
    );
    if (renderedPage) {
      const idx = this.allRenderedPages.indexOf(renderedPage);
      this.allRenderedPages.splice(idx, 1, newPage);
    } else this.allRenderedPages.push(newPage);
  }
}

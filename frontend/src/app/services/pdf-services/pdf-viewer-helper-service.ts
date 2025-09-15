import { ElementRef, Injectable } from '@angular/core';
import { Page } from '../../models/Page';

@Injectable({
  providedIn: 'root',
})
export class PdfViewerHelperService {
  public allRenderedPages: Page[] = [];
  public currentScale: number = 1.0;
  public scaleStep: number = 0.1;

  public minScale = 0.6;
  public maxScale = 10.09;

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
   * Get a PDF page with a certain pageNumber.
   * @param pageNumber => Page to get.
   * @returns
   */
  getPageWithOriginalNumber(pageNumber: number) {
    const page = this.allRenderedPages.find(
      (p) => p.originalPageNum == pageNumber,
    );
    return page;
  }

  updatePageNumbersOnDelete(pageNumber: number) {
    const page = this.getPageWithNumber(pageNumber);
    if (page) {
      const currIdx = this.allRenderedPages.indexOf(page);

      //prettier-ignore
      for (let i = currIdx; i < this.allRenderedPages.length; i++) {
        this.allRenderedPages.at(i)!.updatePageNum--
        this.allRenderedPages.at(i)!.htmlContainerPreview.instance.pageNumber = this.allRenderedPages.at(i)!.updatePageNum
      }
    }
  }

  checkScaleValid(scale: number) {
    const startScale = scale;
    if (scale < this.minScale) scale = this.minScale;

    if (scale > this.maxScale) scale = this.maxScale;

    if (scale != startScale) return { scale: scale, valid: false };
    return { scale: scale, valid: true };
  }

  checkScaleUpPossible(scale: number) {
    if (scale >= this.maxScale) return false;

    return true;
  }

  checkScaleDownPossible(scale: number) {
    if (scale <= this.minScale) return false;

    return true;
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

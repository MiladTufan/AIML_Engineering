import { ElementRef, inject, Injectable } from '@angular/core';
import { Page } from '../../models/Page';
import { RenderParams } from '../../models/Renderparams';
import { PageInfoComponent } from '../../components/pdf-components/page-info-component/page-info-component';
import { DynamicContainerRegistry } from '../shared/dynamic-container-registry';
import { Constants } from '../../models/constants/constants';
//prettier-ignore
@Injectable({
  providedIn: 'root',
})

export class PdfViewerHelperService {
  // TODO: Switch this with a Map so access is faster for many pages!!!
  // public allRenderedPages: Map<number, Page> = new Map<number, Page>();
  public allRenderedPages: Page[] = [];
  public currentScale: number = 1.0;
  public scaleStep: number = 0.1;

  public minScale = 0.1;
  public maxScale = 10.09;

  private dynamicContainerRegistry: DynamicContainerRegistry = inject(DynamicContainerRegistry)

  /**
   * Get a PDF page with a certain pageNumber.
   * @param pageNumber => Page to get.
   * @returns
   */
  getPageWithNumber(pageNumber: number) {
    const page = this.allRenderedPages.find((p) => p.pageNum === pageNumber);
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
  
  /**
   * Updates the pageNumber of the page with @param currentPageNumber
   * @param currentPageNumber 
   * @param newPageNumber 
   */
  public updatePageNumbers(currentPageNumber: number, newPageNumber: number)
  {
    const page = this.getPageWithNumber(currentPageNumber)
    if (page)
    {
      page.pageNum = newPageNumber
    }
  }

  /**
   * Creates a PageInfo Component for pageNumber.
   * @param pageNumber 
   * @param scale 
   * @returns 
   */
  public createPageInfoComponent(pageNumber: number, scale: number)
  {
     const pageInfo =
      this.dynamicContainerRegistry.dynamicBoxContainer?.createComponent(
        PageInfoComponent,
      );
    pageInfo!.instance.pageNumber = pageNumber;
    pageInfo!.instance.width = 30 * scale;
    pageInfo!.instance.fontSize = 16 * scale;
    pageInfo!.instance.borderRadius = 6 * scale;
    pageInfo!.location.nativeElement.id = `pageInfo-${pageNumber}`;

    const firstDiv = pageInfo!.location.nativeElement.querySelector('div');
    firstDiv.classList.add('flex-col');
    return pageInfo
  }
  
  /**
   * This functions updates the Container numbers in the DOM
   * @param container => container to update
   * @param currentPageNumber => the current page number of the container
   * @param newPageNumber => the new pageNumber to update the container with
   */
  public updateContainerNumbers(container: HTMLDivElement, oldPageNumber: number, newPageNumber: number, scale: number)
  {
    const canvasContainer = container.querySelector(`#canvasContainer-${oldPageNumber}`)!;
    const canvas = canvasContainer.querySelector(`#page-${oldPageNumber}`)!;
    const oldPageInfo = canvasContainer.querySelector(`#pageInfo-${oldPageNumber}`)!;
    const newPageInfo = this.createPageInfoComponent(newPageNumber, scale)

    canvasContainer.replaceChild(newPageInfo?.location.nativeElement, oldPageInfo)

    canvasContainer.id = `canvasContainer-${newPageNumber}`
    canvas.id = `page-${newPageNumber}`
    container.id = `pageContainer-${newPageNumber}`
  }

  /**
   * Update all container numbers and page numbers when a page is inserted
   * @param renderparams 
   * @param basePageNumber 
   */
  public updateOnInsert(renderparams: RenderParams, basePageNumber: number)
  {
    this.allRenderedPages.forEach(p => {
      if (p.pageNum > basePageNumber)
      {
        this.updateContainerNumbers(p.htmlContainer, p.pageNum,  p.pageNum + 1, renderparams.scale);
        p.pageNum+= 1;
      }
      return p
    })
  }

  /**
   * This function copies an entire canvas as it is.
   * @param renderparams 
   * @returns 
   */
  public copyCanvas(renderparams: RenderParams)
  {
    const basePage = this.getPageWithNumber(renderparams.pageNumber);
    if (basePage)
    { 
      const clonedPageContainer = basePage.htmlContainer.cloneNode(true) as HTMLDivElement;

      const originalCanvasContainer = basePage.htmlContainer.querySelector(`#canvasContainer-${renderparams.pageNumber}`);
      const clonedCanvasContainer = clonedPageContainer.querySelector(`#canvasContainer-${renderparams.pageNumber}`)!;

      const clonedTextBoxLayer = clonedPageContainer.querySelector(Constants.OVERLAY_TEXT)!;
      const clonedImgBoxLayer = clonedPageContainer.querySelector(Constants.OVERLAY_IMG)!;

      const textBoxLayer = document.createElement('div');
      const imgBoxLayer = document.createElement('div');
      textBoxLayer.className = 'text-box-layer';
      imgBoxLayer.className = 'img-box-layer';

      const originalCanvas = originalCanvasContainer.querySelector(`#page-${renderparams.pageNumber}`);
      const clonedCanvas = clonedCanvasContainer.querySelector(`#page-${renderparams.pageNumber}`);

      const copiedCanvas = document.createElement('canvas');
      copiedCanvas.id = `page-${renderparams.pageNumber}`

      copiedCanvas.width = originalCanvas.width * renderparams.scale;
      copiedCanvas.height = originalCanvas.height * renderparams.scale;

      const ctx = copiedCanvas.getContext('2d')!;
      ctx.scale(renderparams.scale, renderparams.scale);
      ctx.drawImage(originalCanvas, 0, 0);

      clonedCanvasContainer.replaceChild(copiedCanvas, clonedCanvas!)
      clonedCanvasContainer.replaceChild(textBoxLayer, clonedTextBoxLayer)
      clonedCanvasContainer.replaceChild(imgBoxLayer, clonedImgBoxLayer)
      
      return {clonedPageContainer: clonedPageContainer, basePage: basePage, 
              clonedTextBoxLayer: textBoxLayer, clonedImgBoxLayer: imgBoxLayer}
    }
    return {clonedPageContainer: null, basePage: basePage, 
              clonedTextBoxLayer: null, clonedImgBoxLayer: null}
  }
}

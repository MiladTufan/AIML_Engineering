import {
  ElementRef,
  inject,
  Injectable,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Page } from '../../models/Page';
import { PageInfoComponent } from '../../components/pdf-components/page-info-component/page-info-component';
import { DynamicContainerRegistry } from '../shared/dynamic-container-registry';
import { TextBox } from '../../models/box-models/TextBox';
import { ImgBox } from '../../models/box-models/ImgBox';
import { EntityManagerService } from '../box-services/entity-manager-service';
import { BoxCreationService } from '../box-services/box-creation-service';
import { TextEditService } from '../box-services/text-edit-service';
import { PdfViewerHelperService } from './pdf-viewer-helper-service';
import { PageOverlay } from '../../components/pdf-components/page-overlay/page-overlay';

@Injectable({
  providedIn: 'root',
})
export class PDFViewerService {
  private _currentPage = new BehaviorSubject<number>(1);

  public visiblePages = new BehaviorSubject<Set<number>>(new Set<number>());
  public standardMarginTop = 64;
  public totalPages: number = 0;
  public currentScrollTop: number = 0;
  public pageHeight: number = 0;
  public previewPageHeight: number = 0;

  public currentBaseMarginScale: number = 1.0;
  public allPageContainers: any;

  public jumpToPage: Boolean = false;
  public ignoreResizeTimeout: any = null;

  public PdfContainer: ElementRef | null = null;
  public pdfDocument: any;

  public isCurrentlyJumpingTopage: Boolean = false;

  public currentPage$ = this._currentPage.asObservable();

  private dynamicContainerRegistry: DynamicContainerRegistry = inject(
    DynamicContainerRegistry,
  );
  private entityManagerService: EntityManagerService =
    inject(EntityManagerService);
  private boxCreationService: BoxCreationService = inject(BoxCreationService);
  private textEditService: TextEditService = inject(TextEditService);
  private pdfViewerHelperService: PdfViewerHelperService = inject(
    PdfViewerHelperService,
  );

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
    this.PdfContainer = scrollContainer;
  }

  /**
   * Sets the current Pdf Document.
   * @param doc => current document
   */
  setPdfDocument(doc: any) {
    this.pdfDocument = doc;
  }

  //=======================================================================================================================
  // Get the canvas where the actual PDF page is printed in.
  //=======================================================================================================================
  getCanvasForPageContainer(pageContainer: any, pageNumber: number) {
    return pageContainer.querySelector(`#page-${pageNumber}`);
  }

  getCanvasForPage(pageNumber: number) {
    const container = this.PdfContainer!.nativeElement.querySelector(
      `#pageContainer-${pageNumber}`,
    );
    return container;
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
      const firsCmp = (i - 1) * this.pageHeight;
      const scndCmp = i * this.pageHeight;
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
  //prettier-ignore
  calcTargetScrolltop(pageNumber: number, preview: Boolean = false) {
    if (!preview)
      return (pageNumber - 1) * (this.pageHeight + 17);
    else
      return (pageNumber - 1) * (this.previewPageHeight + 17)
  }

  //=======================================================================================================================
  // This function adjusts the current scrolltop to jump to a certain page.
  //=======================================================================================================================
  scrollToPage(pageNumber: number) {
    this.isCurrentlyJumpingTopage = true;
    this.jumpToPage = true;
    console.log('Jump to page: ', pageNumber);
    const targetScrolltop = this.calcTargetScrolltop(pageNumber);
    // this.PdfContainer!.nativeElement.scrollTop = targetScrolltop;

    this.PdfContainer!.nativeElement.scroll({
      top: targetScrolltop,
      behavior: 'smooth',
    });
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
    window.addEventListener(
      'wheel',
      (event) => {
        if (event.ctrlKey) {
          event.preventDefault();
        }
      },
      { passive: false },
    );
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
    let baseMarginScale = 16;
    if (scale > 1.0 && pageNumber > 1) {
      const fract = scale - Math.floor(scale);
      const fractFull = Math.floor(scale) - 1 + fract;
      const multiplier = 10;
      const marginOffset = fractFull * multiplier;
      baseMarginScale = 16 * marginOffset;
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
  createPageContainers(
    pageNumber: number,
    renderdummy: Boolean,
    scale: number,
  ) {
    const canvas = document.createElement('canvas');
    const textBoxLayer = document.createElement('div');
    const imgBoxLayer = document.createElement('div');

    let textLayer = document.createElement('div');
    let pageContainer = document.createElement('div');
    const canvasContainer = document.createElement('div');

    const pageInfo =
      this.dynamicContainerRegistry.dynamicBoxContainer?.createComponent(
        PageInfoComponent,
      );
    pageInfo!.instance.pageNumber = pageNumber;
    pageInfo!.instance.width = 30 * scale;
    pageInfo!.instance.fontSize = 16 * scale;
    pageInfo!.instance.borderRadius = 6 * scale;

    const firstDiv = pageInfo!.location.nativeElement.querySelector('div');
    firstDiv.classList.add('flex-col');

    canvas.id = `page-${pageNumber}`;
    canvasContainer.id = `canvasContainer-${pageNumber}`;

    canvasContainer.style.display = 'flex';
    canvasContainer.style.gap = '8px';

    pageContainer.id = `pageContainer-${pageNumber}`;
    textBoxLayer.className = 'text-box-layer';
    imgBoxLayer.className = 'img-box-layer';

    if (!renderdummy) {
      pageContainer.className =
        'mt-1 sm:mt-3 md:mt-4 mx-auto relative block w-full max-w-fit sm:max-w-[70%] md:max-w-[90%]';
      if (scale == 1.0)
        canvas.className = `page-${pageNumber} block border border-gray-300 shadow-lg -mb-[305px]`;
      else
        canvas.className = `page-${pageNumber} block border border-gray-300 shadow-lg`;
    } else {
      pageContainer.className = `mt-1 sm:mt-3 md:mt-4 mx-auto relative block w-full max-w-fit sm:max-w-[70%] md:max-w-[90%]`;
      canvas.className = `page-${pageNumber} block border border-gray-300 shadow-lg mx-auto`;
    }

    canvasContainer.appendChild(imgBoxLayer);
    canvasContainer.appendChild(textBoxLayer);
    canvasContainer.appendChild(canvas);
    canvasContainer.appendChild(pageInfo!.location.nativeElement);

    pageContainer.appendChild(canvasContainer);

    return {
      canvas: canvas,
      textBoxLayer: textBoxLayer,
      textLayer: textLayer,
      pageContainer: pageContainer,
      canvasContainer: canvasContainer,
      imgBoxLayer: imgBoxLayer,
    };
  }

  /**
   * This function recreates all the textboxes according to the scale
   * @param boxesForPage => all textboxes to recreate on the page
   * @param pageNumber => the page where the textboxes are placed
   * @param scale => current scale of the PDF
   * @param textBoxLayer => the parent container where the textboxes are placed.
   */
  recreateTextBoxesForPage(
    boxesForPage: TextBox[],
    pageNumber: number,
    scale: number,
    textBoxLayer: HTMLDivElement,
  ) {
    boxesForPage.forEach((box) => {
      if (box.pageId === pageNumber) {
        const scaleParams = this.entityManagerService.rescaleObjOnRender(
          box,
          scale,
        );
        this.setCodeResizeTimeout();

        const blockObj = this.boxCreationService.createBlockObject(
          pageNumber,
          scaleParams.dims,
          true,
        );

        const textbox = this.textEditService.toTextBox(blockObj);
        textbox.StyleState = box.StyleState;
        textbox.text = box.text;
        const ret = this.boxCreationService.createTextBox(
          textbox,
          box,
          pageNumber,
        );

        ret.box.baseHeight = scaleParams.baseHeight;
        ret.box.baseWidth = scaleParams.baseWidth;
        textBoxLayer.appendChild(ret.parent.location.nativeElement);
      }
    });
  }

  /**
   * This function recreates all the ImgBoxes according to the scale
   * @param boxesForPage => all ImgBoxes to recreate on the page
   * @param pageNumber => the page where the ImgBoxes are placed
   * @param scale => current scale of the PDF
   * @param textBoxLayer => the parent container where the ImgBoxes are placed.
   */
  recreateImgBoxesForPage(
    boxesForPage: ImgBox[],
    pageNumber: number,
    scale: number,
    imgBoxLayer: HTMLDivElement,
  ) {
    boxesForPage.forEach((box) => {
      if (box.pageId === pageNumber) {
        const scaleParams = this.entityManagerService.rescaleObjOnRender(
          box,
          scale,
        );
        this.setCodeResizeTimeout();

        const blockObj = this.boxCreationService.createBlockObject(
          pageNumber,
          scaleParams.dims,
          true,
        );
        const ret = this.boxCreationService.createImgBox(
          blockObj,
          box,
          pageNumber,
          box.src,
        );

        ret.box.baseHeight = scaleParams.baseHeight;
        ret.box.baseWidth = scaleParams.baseWidth;
        imgBoxLayer.appendChild(ret.parent.location.nativeElement);
      }
    });
  }

  private recreateObjectsForPage(
    pageNumber: number,
    scale: number,
    textBoxLayer: HTMLDivElement,
    imgBoxLayer: HTMLDivElement,
  ) {
    const boxesForPage = this.entityManagerService.blockObjects.filter(
      (b) => b.pageId === pageNumber && b instanceof TextBox,
    ) as TextBox[];
    const imgBoxesForPage = this.entityManagerService.blockObjects.filter(
      (b) => b.pageId === pageNumber && b instanceof ImgBox,
    ) as ImgBox[];

    this.recreateTextBoxesForPage(
      boxesForPage,
      pageNumber,
      scale,
      textBoxLayer,
    );
    this.recreateImgBoxesForPage(
      imgBoxesForPage,
      pageNumber,
      scale,
      imgBoxLayer,
    );

    return { boxesForPage: boxesForPage, imgBoxesForPage: imgBoxesForPage };
  }

  replaceChildrenOfPageContainer(
    container: HTMLDivElement,
    renderdummy: Boolean,
    pageNumber: number,
    scale: number,
  ) {
    let {
      canvas,
      textBoxLayer,
      textLayer,
      pageContainer,
      canvasContainer,
      imgBoxLayer,
    } = this.createPageContainers(pageNumber, renderdummy, scale);
    const baseMarginScale = this.getScaledMargin(scale, pageNumber);

    const { boxesForPage, imgBoxesForPage } = this.recreateObjectsForPage(
      pageNumber,
      scale,
      textBoxLayer,
      imgBoxLayer,
    );

    const existingPageContainer = container.querySelector(
      '#' + pageContainer.id,
    );
    let ret;
    if (existingPageContainer != null) {
      let CanvasOld = existingPageContainer.querySelector(
        '#' + canvasContainer.id,
      ) as HTMLDivElement;
      this.recreateTextBoxesForPage(
        boxesForPage,
        pageNumber,
        scale,
        textBoxLayer,
      );

      existingPageContainer.replaceChild(canvasContainer, CanvasOld!);

      if (!renderdummy) {
        existingPageContainer.className =
          'mt-1 sm:mt-3 md:mt-4 mx-auto relative block w-full max-w-fit sm:max-w-[70%] md:max-w-[90%]';
      }

      pageContainer = existingPageContainer as HTMLDivElement;
    } else {
      container.appendChild(pageContainer);
    }
    return {
      canvas,
      textBoxLayer,
      textLayer,
      pageContainer,
      canvasContainer,
      baseMarginScale,
      boxesForPage,
      imgBoxLayer,
    };
  }

  async previewRender(pageNumber: number, scale: number, container: any) {
    let page: any;
    let viewport: any;

    page = await this.pdfDocument.getPage(pageNumber);
    viewport = page.getViewport({ scale: scale });
    let previewContainer = document.createElement('div');
    let canvas = document.createElement('canvas');

    previewContainer.className = 'relative block';
    canvas.className = 'relative block';

    const pageOverlay =
      this.dynamicContainerRegistry.dynamicBoxContainer?.createComponent(
        PageOverlay,
      );

    if (pageOverlay) {
      // Insert at index 0

      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      this.previewPageHeight = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        intent: 'print',
      };

      previewContainer.addEventListener('click', () =>
        this.scrollToPage(pageNumber),
      );
      previewContainer.appendChild(canvas);

      const firstChild = pageOverlay.location.nativeElement.firstChild;
      const firstChildOfFirst = firstChild.firstChild;
      firstChild.insertBefore(previewContainer, firstChildOfFirst);

      pageOverlay.instance.pageNumber = pageNumber;

      // previewContainer.appendChild(pageInfo!.location.nativeElement);
      container.appendChild(firstChild);
      await page.render(renderContext).promise;
    }
  }
  /**
   * Main render function. This function is the entry point for the entire rendering logic.
   * It handles all logic from creating the pdf canvas to recreating all objects on the PDF page itself.
   * @param pageNumber => the page to render
   * @param renderdummy => render a dummy page?
   * @param scale => the scale to render the page in.
   */
  async renderPage(
    pageNumber: number,
    renderdummy: Boolean = true,
    preview: Boolean = false,
    scale: number,
    container: any,
  ) {
    if (preview) {
      this.previewRender(pageNumber, scale, container);
    } else {
      let page: any;
      let viewport: any;

      if (pageNumber === 1) renderdummy = false;

      console.log('rendering page: ', pageNumber);
      page = await this.pdfDocument.getPage(pageNumber);

      if (!renderdummy) {
        page = await this.pdfDocument.getPage(pageNumber);
        viewport = page.getViewport({ scale: scale });
        this.setPageHeight(viewport.height);
      }
      //prettier-ignore
      let {canvas,textBoxLayer,textLayer,pageContainer,canvasContainer,baseMarginScale,boxesForPage, imgBoxLayer} = this.replaceChildrenOfPageContainer(
        container,
        renderdummy,
        pageNumber,
        scale,
      );

      if (!renderdummy) {
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        pageContainer.style.width = `${viewport.width}px`;
        pageContainer.style.height = `${viewport.height}px`;
        pageContainer.style.marginTop = `${baseMarginScale}px`;

        if (pageNumber == this.totalPages)
          pageContainer.style.marginBottom = '128px';
        this.currentBaseMarginScale = baseMarginScale;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          intent: 'print',
        };

        await page.render(renderContext).promise;

        //prettier-ignore
        const newPage = new Page(pageNumber, viewport, boxesForPage, [], viewport.height, viewport.width, 0,
          pageContainer, 0, 0, scale,);
        this.pdfViewerHelperService.assignPageToRendered(newPage);
      }
    }
  }
}

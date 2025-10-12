import {
  ComponentRef,
  ElementRef,
  inject,
  Injectable,
  NgZone,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
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
import { OrganizeService } from './organize-service';
import * as pdfjsLib from 'pdfjs-dist';
import { RenderParams } from '../../models/Renderparams';
import { ImgBoxService } from '../box-services/img-box-service';
import { EventBusService } from '../communication/event-bus-service';
import { Constants } from '../../models/constants/constants';
import { BlockObject } from '../../models/box-models/BlockObject';

//prettier-ignore
@Injectable({
  providedIn: 'root',
})
export class PDFViewerService {
  private _currentPage = new BehaviorSubject<number>(1);
  private pageCache = new Map<number, pdfjsLib.PDFPageProxy>();

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

  public isCurrentlyJumpingTopage: number = 1;

  private htmlPreviewPages: any[] = [];
  private navigatorContainer: ElementRef | null = null;

  public renderQueue = new Set<number>();
  public renderTrigger = new Subject<number>();
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
  private organizeService: OrganizeService = inject(OrganizeService);
    private imgBoxService: ImgBoxService = inject(ImgBoxService);

  private eventBusService: EventBusService = inject(EventBusService)


  deletePage(pageNumber: number) {
    // this.deletedPages.push(pageNumber);
    const page = this.pdfViewerHelperService.getPageWithNumber(pageNumber);

    if (page && page.isDeleted == false) {
      // remove from DOM
      // this.PdfContainer?.nativeElement.removeChild(page.htmlContainer);
      // this.navigatorContainer?.nativeElement.removeChild(
      //   page.htmlContainerPreview,
      // );

      // hide in the DOM
      page.htmlContainer.style.display = 'none';
      page.htmlContainerPreview.location.nativeElement.firstChild.style.display =
        'none';
      page.isDeleted = true;

      // reduce total page numbers
      this.totalPages--;

      // remove from visible Pages
      this.removeVisiblePages(pageNumber);
      this.pdfViewerHelperService.updatePageNumbersOnDelete(page.pageNum);
    } else {
      console.warn('The Page to delete does not exist!');
    }
  }

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
    this.jumpToPage = true;
    this.isCurrentlyJumpingTopage = pageNumber;
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
   * looks into the page cache to see if page was parsed once and returns that
   * @param pageNumber => pageNumber to get.
   * @returns 
   */
  async getCachedPage(pageNumber: number) {
    if (!this.pageCache.has(pageNumber)) {
      const page = await this.pdfDocument.getPage(pageNumber);
      this.pageCache.set(pageNumber, page);
    }
    return this.pageCache.get(pageNumber)!;
  }

  /**
   * Inserts a 
   * @param pageNumber 
   * @param pageProxy 
   */
  async insertIntoPageCache(pageNumber: number, pageProxy: pdfjsLib.PDFPageProxy)
  {
    const keys = Array.from(this.pageCache.keys()).sort((a, b) => b - a);
    const newMap = new Map<number, pdfjsLib.PDFPageProxy>();

    for (const key of keys) {
      if (key >= pageNumber) {
        newMap.set((key + 1) as number, this.pageCache.get(key)!);
      } else {
        newMap.set(key, this.pageCache.get(key)!);
      }
    }
    newMap.set(pageNumber, pageProxy)
    this.pageCache = newMap
  }


  private createLayers()
  {
    const textBoxLayer = document.createElement('div');
    const imgBoxLayer = document.createElement('div');

    textBoxLayer.className = 'text-box-layer';
    imgBoxLayer.className = 'img-box-layer';

    return {textBoxLayer: textBoxLayer, imgBoxLayer: imgBoxLayer}
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

    const {textBoxLayer, imgBoxLayer} = this.createLayers()

    let textLayer = document.createElement('div');
    let pageContainer = document.createElement('div');
    const canvasContainer = document.createElement('div');

    const pageInfo = this.pdfViewerHelperService.createPageInfoComponent(pageNumber, scale)
    canvas.id = `page-${pageNumber}`;
    canvasContainer.id = `canvasContainer-${pageNumber}`;

    canvasContainer.style.display = 'flex';
    canvasContainer.style.gap = '8px';

    pageContainer.id = `pageContainer-${pageNumber}`;

      pageContainer.className =
        'mt-1 sm:mt-3 md:mt-4 mx-auto relative block w-full max-w-fit sm:max-w-[70%] md:max-w-[90%]';
      canvas.className = `page-${pageNumber} block border border-gray-300 shadow-lg`;

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
        const scaleParams = this.entityManagerService.rescaleObjOnRender(box, scale,);
        this.setCodeResizeTimeout();

        const blockObj = this.boxCreationService.createBlockObject(pageNumber, scaleParams.dims, true,);

        const textbox = this.textEditService.toTextBox(blockObj);
        textbox.StyleState = box.StyleState;
        textbox.text = box.text;
        const ret = this.boxCreationService.createTextBox(textbox, box, pageNumber,);

        ret.box.baseHeight = scaleParams.baseHeight;
        ret.box.baseWidth = scaleParams.baseWidth;
        textBoxLayer.appendChild(ret.parent.location.nativeElement);
      }
    });
  }

    /**
   * This function recreates all the textboxes according to the scale
   * @param boxesForPage => all textboxes to recreate on the page
   * @param pageNumber => the page where the textboxes are placed
   * @param scale => current scale of the PDF
   * @param textBoxLayer => the parent container where the textboxes are placed.
   */
  recreateTextBoxesForPreview(
    boxesForPage: TextBox[],
    pageNumber: number,
    scale: number,
    textBoxLayer: HTMLDivElement,
  ) {
    boxesForPage.forEach((box) => {
      if (box.pageId === pageNumber) {
        const scaleParams = this.entityManagerService.rescaleObjOnRender(box, scale,);
        this.setCodeResizeTimeout();
        const blockObj = this.boxCreationService.createBlockObject(pageNumber, scaleParams.dims, true,);

        const textbox = this.textEditService.toTextBox(blockObj);
        textbox.StyleState = box.StyleState;
        textbox.StyleState.textFontSize = textbox.StyleState.textBaseFontSize * this.pdfViewerHelperService.currentScale;
        textbox.text = box.text;
        const ret = this.boxCreationService.createDynamicCommonBox(false)

        ret.textBoxContainer.instance.box = textbox;
        ret.commonBoxContainer.instance.boxBase = textbox as BlockObject;
        ret.commonBoxContainer.instance.resizable = false;
        ret.textBoxContainer.instance.isEditable = false;

        textbox.baseHeight = scaleParams.baseHeight;
        textbox.baseWidth = scaleParams.baseWidth;
        textBoxLayer.appendChild(ret.commonBoxContainer.location.nativeElement);
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
        const scaleParams = this.entityManagerService.rescaleObjOnRender(box, scale,);
        this.setCodeResizeTimeout();

        const blockObj = this.boxCreationService.createBlockObject(pageNumber, scaleParams.dims,true,);
        const ret = this.boxCreationService.createImgBox(blockObj,box,pageNumber,box.src,);

        ret.box.baseHeight = scaleParams.baseHeight;
        ret.box.baseWidth = scaleParams.baseWidth;
        imgBoxLayer.appendChild(ret.parent.location.nativeElement);
      }
    });
  }

  /**
   * Recreate all objects for a particular page.
   * @param pageNumber 
   * @param scale 
   * @param textBoxLayer 
   * @param imgBoxLayer 
   * @returns 
   */
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

    this.recreateTextBoxesForPage(boxesForPage, pageNumber, scale, textBoxLayer);
    this.recreateImgBoxesForPage(imgBoxesForPage, pageNumber, scale, imgBoxLayer);

    return { boxesForPage: boxesForPage, imgBoxesForPage: imgBoxesForPage };
  }

  private recreateObjectsForPreview(pageNumber: number,
    scale: number,
    textBoxLayer: HTMLDivElement,
    imgBoxLayer: HTMLDivElement,)
    {
      const boxesForPage = this.entityManagerService.blockObjects.filter(
        (b) => b.pageId === pageNumber && b instanceof TextBox,
      ) as TextBox[];
      const imgBoxesForPage = this.entityManagerService.blockObjects.filter(
        (b) => b.pageId === pageNumber && b instanceof ImgBox,
      ) as ImgBox[];

      this.recreateTextBoxesForPreview(boxesForPage, pageNumber, scale, textBoxLayer);
      // this.recreateImgBoxesForPreview(imgBoxesForPage, pageNumber, scale, imgBoxLayer);

    return { boxesForPage: boxesForPage, imgBoxesForPage: imgBoxesForPage };

    }


  /**
   * Replace all child containers of container with new ones (in case of rerender)
   * @param container 
   * @param renderdummy 
   * @param pageNumber 
   * @param scale 
   * @returns 
   */
  replaceChildrenOfPageContainer(
    container: HTMLDivElement,
    renderdummy: Boolean,
    pageNumber: number,
    scale: number,
  ) {
    const ret = this.createPageContainers(pageNumber, renderdummy, scale);
    const baseMarginScale = this.getScaledMargin(scale, pageNumber);

    const { boxesForPage, imgBoxesForPage } = this.recreateObjectsForPage(pageNumber, scale, ret.textBoxLayer,ret.imgBoxLayer,);

    const existingPageContainer = container.querySelector('#' + ret.pageContainer.id,);

    if (existingPageContainer != null) {
      let CanvasOld = existingPageContainer.querySelector('#' + ret.canvasContainer.id,) as HTMLDivElement;
      //this.recreateTextBoxesForPage(boxesForPage, pageNumber, scale, ret.textBoxLayer,);

      existingPageContainer.replaceChild(ret.canvasContainer, CanvasOld!);

      if (!renderdummy) {
        existingPageContainer.className =
          'mt-1 sm:mt-3 md:mt-4 mx-auto relative block w-full max-w-fit sm:max-w-[70%] md:max-w-[90%]';
      }

      ret.pageContainer = existingPageContainer as HTMLDivElement;
    } else {
      container.appendChild(ret.pageContainer);
    }
    
    return {
      canvas: ret.canvas,
      textBoxLayer: ret.textBoxLayer,
      textLayer: ret.textLayer,
      pageContainer: ret.pageContainer,
      canvasContainer: ret.canvasContainer,
      baseMarginScale: baseMarginScale,
      boxesForPage: boxesForPage,
      imgBoxLayer: ret.imgBoxLayer,
    };
  }


  /**
   * free up the pageNumber in the container
   * This increases the pagenumbers of all pages >= pageNumberToEnter by 1.
   * @param container
   * @param idTag
   * @param pageNumberToEnter
   */
  createSpaceForPage(container: any, idTag: string, pageNumberToEnter: number) {
    const collection: HTMLCollection = container.nativeElement.children;
    const comprefsToChange: any[] = [];

    Array.from(collection).forEach((child: Element, index: number) => {
      console.log('Current ID:', child.id);
      let pageNumber = parseInt(child.id?.split('-')[1]);
      if (pageNumber >= pageNumberToEnter) {
        pageNumber++;
        child.id = `#${idTag}-${pageNumber}`;
      }
    });
  }


  //=========================================================================================
  // TODO continue from here !!!!! rework the rendering to make it easier to integrate more 
  // rendering options.



 

  /**
   * Creates a PageOverlay and sets necessary parameters for it.
   * @param renderparams 
   * @param previewContainer 
   * @returns 
   */
  private createPageOverlay(renderparams: RenderParams, previewContainer: HTMLDivElement)
  {
    const pageOverlay = this.dynamicContainerRegistry.dynamicBoxContainer?.createComponent(PageOverlay);
    if (pageOverlay) {
      pageOverlay.location.nativeElement.id = `PageOverlay-${renderparams.pageNumber}`;

     const firstChild = pageOverlay.location.nativeElement.firstChild;
      const firstChildOfFirst = firstChild.firstChild;
      firstChild.insertBefore(previewContainer, firstChildOfFirst);

      const ref = this.organizeService.getCompref(renderparams.pageNumber);
      if (ref) {
        pageOverlay.instance.isChecked = ref.instance.isChecked || this.organizeService.isPageChecked(renderparams.pageNumber);
        pageOverlay.instance.isPageDeleted = ref.instance.isPageDeleted || this.organizeService.isPageDeleted(renderparams.pageNumber);
      }
      else
      {
        pageOverlay.instance.isChecked = this.organizeService.isPageChecked(renderparams.pageNumber);
        pageOverlay.instance.isPageDeleted = this.organizeService.isPageDeleted(renderparams.pageNumber);
      }
      pageOverlay.instance.pageNumber = renderparams.pageNumber;
      pageOverlay.instance.IsOrganizePreview = renderparams.isOrganize;
      pageOverlay.instance.IsNavigator = renderparams.isNavigator;
      pageOverlay.instance.currentRotation = renderparams.rotation;
      return {overlay: pageOverlay, ref: ref}
    }
    return null
  }

  /**
   * initializes the previewContainer and sets it click listener
   * @param renderparams 
   * @param ret 
   * @param previewContainer 
   * @param canvas 
   */
  private initPreviewCotainer(renderparams: RenderParams, ret: {overlay: ComponentRef<PageOverlay>, ref: ComponentRef<PageOverlay> | undefined}, 
          previewContainer: HTMLDivElement, canvas: any)
  {
    previewContainer.classList.add('cursor-pointer');
    previewContainer.classList.add('hover:border-blue-500');
    canvas.classList.add("border-1")
    canvas.classList.add("border-black/20")
    canvas.classList.add("shadow-lg")
    previewContainer.appendChild(canvas);

    this.setPreviewPageClick(renderparams, previewContainer, ret)

  }

  setPreviewPageClick(renderparams: RenderParams, previewContainer: HTMLDivElement, 
                     ret: {overlay: ComponentRef<PageOverlay>, ref: ComponentRef<PageOverlay> | undefined})
  {
    previewContainer.addEventListener('click', () => {
      if (!this.organizeService.organizerActive) {
        ret.overlay.instance.isActivePage = true;
        this.scrollToPage(renderparams.pageNumber);
      } else {
        ret.overlay.instance.isChecked = !ret.overlay.instance.isChecked;
        if (ret.overlay.instance.isChecked) {
          if (!this.organizeService.checkedPages.includes(renderparams.pageNumber))
            this.organizeService.checkedPages.push(renderparams.pageNumber);
        }
        else
        {
           this.organizeService.checkedPages = this.organizeService.checkedPages.filter(p => p !== renderparams.pageNumber)
        }
      }
    });
  }

  /**
   * renders a preview page
   * @param renderparams 
   */
  private async renderPreview(renderparams: RenderParams)
  {
    let page: any;
    let viewport: any;

    if (this.navigatorContainer == null && !renderparams.isOrganize)
      this.navigatorContainer = renderparams.container;

    page = await this.pdfDocument.getPage(renderparams.pageNumber);
    viewport = page.getViewport({ scale: renderparams.scale, rotation: renderparams.rotation });

    let previewContainer = document.createElement('div');
    let canvas = document.createElement('canvas');

    const ret = this.createPageOverlay(renderparams, previewContainer)

    if (ret) {
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height
      canvas.width = viewport.width

      this.previewPageHeight = viewport.height
      this.initPreviewCotainer(renderparams, ret, previewContainer, canvas);

      // if (ret.ref)
      //   renderparams.container.nativeElement.replaceChild(
      //     ret.overlay.location.nativeElement,
      //     ret.ref.location.nativeElement );
      // else
      renderparams.container.nativeElement.appendChild(ret.overlay.location.nativeElement);

      const renderContext = { canvasContext: context, viewport: viewport};
      await page.render(renderContext).promise;

      const payLoad = {pageNum: renderparams.pageNumber,preview: ret.overlay};

      this.htmlPreviewPages.push(payLoad);
      if (renderparams.isOrganize)
        this.organizeService.setComprefSafely(renderparams.pageNumber, ret.overlay);
    }
  }

  /**
   * render a dummy page with no content. This is done so that we can prerender an invisible page for intersection detection.
   * Once a dummy page comes close to being in the view it is rendered fully. This is done so we do not have to render every page at the beginning.
   * @param renderparams 
   */
  private async renderDummy(renderparams: RenderParams)
  {
    let ret = this.replaceChildrenOfPageContainer(renderparams.container, renderparams.isDummyPage,
                                                  renderparams.pageNumber,renderparams.scale,);

    ret.canvas.width = Page.widthA4 * renderparams.scale
    ret.canvas.height = Page.heightA4 * renderparams.scale
  }

  /**
   * Render an empty preview page.
   * @param renderparams 
   */
  private async renderEmptyPreview(renderparams: RenderParams)
  {
    let previewContainer = document.createElement('div');
    let canvas = document.createElement('canvas');

    const ret = this.createPageOverlay(renderparams, previewContainer)

    if (ret) {
      const ctx = canvas.getContext('2d')!;
      canvas.width = Page.widthA4 * renderparams.scale;
      canvas.height = Page.heightA4 * renderparams.scale;

      canvas.style.transform = `rotate(${renderparams.rotation}deg)`;
      canvas.style.transformOrigin = 'top left'; // pivot point
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#ccc';
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      this.previewPageHeight = Page.heightA4 * renderparams.scale
      this.initPreviewCotainer(renderparams, ret, previewContainer, canvas);

      ret.overlay.instance.isEmpty = true;
    
      renderparams.container.nativeElement.appendChild(ret.overlay.location.nativeElement);


      const payLoad = {pageNum: renderparams.pageNumber,preview: ret.overlay};

      this.htmlPreviewPages.push(payLoad);
      if (renderparams.isOrganize)
        this.organizeService.setComprefSafely(renderparams.pageNumber, ret.overlay);
    }
  }

  /**
   * Render an empty page.
   * @param renderparams 
   */
  private async renderEmpty(renderparams: RenderParams)
  {
    const ret = this.replaceChildrenOfPageContainer(renderparams.container.nativeElement, 
                                                    renderparams.isDummyPage, renderparams.pageNumber, 
                                                    renderparams.scale);

    const ctx = ret.canvas.getContext('2d')!;
    ret.canvas.width = Page.widthA4 * renderparams.scale;
    ret.canvas.height = Page.heightA4 * renderparams.scale;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, ret.canvas.width, ret.canvas.height);

    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(0, 0, ret.canvas.width, ret.canvas.height);
    
    ret.pageContainer.style.width = `${Page.widthA4 * renderparams.scale}px`;
    ret.pageContainer.style.height = `${Page.heightA4 * renderparams.scale}px`;
    ret.pageContainer.style.marginTop = `${ret.baseMarginScale}px`;
    this.currentBaseMarginScale = ret.baseMarginScale;

    if (renderparams.pageNumber == this.totalPages)
      ret.pageContainer.style.marginBottom = '128px';

    const newPage = new Page(renderparams.pageNumber, null, ret.boxesForPage, [], 
                             Page.heightA4 * renderparams.scale, 
                             Page.widthA4 * renderparams.scale, 0,
                             ret.pageContainer, null, 0, 0, renderparams.scale,);

    this.pdfViewerHelperService.assignPageToRendered(newPage);
  }

  /**
   * Deep Copies all BlockObjects of page with pageNumber. And increases their page Number.
   * This function is used in Duplication of Page.
   * @param pageNumber => pageNumber for which we need to copy blockObjects for.
   */
  private deepCopyBlockObjects(pageNumber: number)
  {
      const objsToClone = this.entityManagerService.blockObjects.filter(b => b.pageId === pageNumber)
      const otherObjsToUpdate = this.entityManagerService.blockObjects.filter(b => b.pageId > pageNumber);
      objsToClone.forEach(element => {
        const clone = structuredClone(element)
        Object.setPrototypeOf(clone, Object.getPrototypeOf(element));

        clone.pageId += 1
        clone.id = this.entityManagerService.getUniqueId(this.entityManagerService.blockObjects)
        this.entityManagerService.blockObjects.push(clone)
      });

      otherObjsToUpdate.forEach(element => {
        element.pageId += 1
        element.id = this.entityManagerService.getUniqueId(this.entityManagerService.blockObjects)
      })
  }



  private async renderDuplicatePreview(renderparams: RenderParams)
  {
    const {clonedPageContainer, basePage, clonedTextBoxLayer, clonedImgBoxLayer} = this.pdfViewerHelperService.copyCanvas(renderparams)

    if (basePage)
    {
      const clonedCanvasContainer = clonedPageContainer.querySelector(`#canvasContainer-${renderparams.pageNumber}`)!;
      const clonedCanvas = clonedPageContainer.querySelector(`#page-${renderparams.pageNumber}`)!;

      // create PageOverlay for preview
      const ret = this.createPageOverlay(renderparams, clonedCanvasContainer as HTMLDivElement)
      clonedCanvas.classList.add("border-1")
      clonedCanvas.classList.add("border-black/20")
      clonedCanvas.classList.add("shadow-lg")
      clonedCanvas.classList.add("cursor-pointer")
      clonedCanvasContainer.classList.add("-ml-4")
      this.setPreviewPageClick(renderparams, clonedCanvasContainer as HTMLDivElement, ret!)

      // recreate the Boxes for preview Scale

      const textLayer = clonedCanvasContainer.querySelector(Constants.OVERLAY_TEXT);
      const imgLayer = clonedCanvasContainer.querySelector(Constants.OVERLAY_IMG);
      this.recreateObjectsForPreview(renderparams.pageNumber, renderparams.scale, 
                                     textLayer as HTMLDivElement, imgLayer as HTMLDivElement)

      // Remove old Preview and replace with new Preview
      const overlay = renderparams.container.nativeElement.querySelector(`#PageOverlay-${renderparams.pageNumber}`)
      const overlayNext = renderparams.container.nativeElement.querySelector(`#PageOverlay-${renderparams.pageNumber+1}`)

      if (!overlay)
        renderparams.container.nativeElement.appendChild(ret?.overlay.location.nativeElement)
      else
      {
        renderparams.container.nativeElement.insertBefore( ret?.overlay.location.nativeElement, overlayNext)
        renderparams.container.nativeElement.removeChild(overlay)
      }
    }


  }

  
  /**
   * Renders a PDF page.
   * @param pageNumber => the page to render.
   * @param scale => the scale to render the page for.
   * @param container => the container to render the page in
   */
  private async renderDuplicate(renderparams: RenderParams)
  {
    const {clonedPageContainer, basePage, clonedTextBoxLayer, clonedImgBoxLayer} = this.pdfViewerHelperService.copyCanvas(renderparams)
    if (basePage)
    {
      let container = basePage.htmlContainer
      const nextPage = this.pdfViewerHelperService.getPageWithNumber(renderparams.pageNumber + 1)

      if (nextPage) container = nextPage.htmlContainer

      this.pdfViewerHelperService.updateOnInsert(renderparams, renderparams.pageNumber)


      this.pdfViewerHelperService.updateContainerNumbers(clonedPageContainer, renderparams.pageNumber, 
                                                         renderparams.pageNumber + 1, renderparams.scale)



      this.deepCopyBlockObjects(renderparams.pageNumber)
      this.recreateObjectsForPage(renderparams.pageNumber + 1, renderparams.scale, 
                                  clonedTextBoxLayer, clonedImgBoxLayer)
      
      renderparams.container.nativeElement.insertBefore(clonedPageContainer, container)

      const newPage = new Page(renderparams.pageNumber+1, basePage.viewport, basePage.blockObjects, [], basePage.height,
                              basePage.width, 0, clonedPageContainer, false, 0, 0, renderparams.scale,);
      newPage._isDuplicate = true;
      newPage.basePageNumber = renderparams.pageNumber
      this.pdfViewerHelperService.allRenderedPages.set(renderparams.pageNumber+1, newPage)
      // this.pdfViewerHelperService.assignPageToRendered(newPage);
      this.totalPages += 1
      this.scrollToPage(renderparams.pageNumber + 1)
      this.getCachedPage(renderparams.pageNumber).then(page => {
        this.insertIntoPageCache(renderparams.pageNumber + 1, page)
      })
    }
  }

  /**
   * Renders a PDF page.
   * @param pageNumber => the page to render.
   * @param scale => the scale to render the page for.
   * @param container => the container to render the page in.
   */
  private async render(renderparams: RenderParams)
  {
    const page = await this.getCachedPage(renderparams.pageNumber)
    const viewport = page.getViewport({ scale: renderparams.scale, rotation: renderparams.rotation });
    this.setPageHeight(viewport.height);

    let ret = this.replaceChildrenOfPageContainer(renderparams.container, false, renderparams.pageNumber, renderparams.scale);
    const context = ret.canvas.getContext('2d')!;
    ret.canvas.height = viewport.height;
    ret.canvas.width = viewport.width;

    ret.pageContainer.style.width = `${viewport.width}px`;
    ret.pageContainer.style.height = `${viewport.height}px`;
    ret.pageContainer.style.marginTop = `${ret.baseMarginScale}px`;
    this.currentBaseMarginScale = ret.baseMarginScale;

    if (renderparams.pageNumber == this.totalPages)
      ret.pageContainer.style.marginBottom = '128px';

    const renderContext = { canvasContext: context, viewport: viewport,intent: 'print', canvas: ret.canvas };

    // this.ngZone.runOutsideAngular(async () => {
      await page.render(renderContext).promise;
    // });

    const newPage = new Page(renderparams.pageNumber, viewport, ret.boxesForPage, [], viewport.height,
                              viewport.width, 0, ret.pageContainer, false, 0, 0, renderparams.scale,);
    this.pdfViewerHelperService.assignPageToRendered(newPage);
    this.eventBusService.emit(Constants.EVENT_PAGE_RENDERED, {pageNumber: renderparams.pageNumber, updated: false})
  }

  /**
   * Main Entrypoint of PDF Page rendering. This function is responsible for calling the appropriate rendering function
   * depending on the paramters provided.
   * @param pageNumber 
   * @param scale 
   * @param container 
   * @param isDummyPage 
   * @param isPreviewPage 
   * @param isEmpty 
   * @param isOrganize 
   * @param isNavigator 
   * @param rotation 
   */
  public async renderPipeline(pageNumber: number, 
                       scale: number, 
                       container: any, 
                       isDummyPage: Boolean = false, 
                       isPreviewPage: Boolean = false, 
                       isEmpty: Boolean = false,
                       isOrganize: Boolean = false,
                       isNavigator: Boolean = false,
                       isDuplicate: Boolean = false,
                       rotation: number = 0)
  {
    const renderparams = new RenderParams(pageNumber, rotation, scale, isDummyPage, isPreviewPage, isOrganize, isNavigator, container)
    if (pageNumber === 1) renderparams.isDummyPage = false;

    if (!isDummyPage && !isEmpty && !isPreviewPage && !isDuplicate)
      this.render(renderparams)
    else if (!isDummyPage && !isEmpty && !isPreviewPage && isDuplicate)
      this.renderDuplicate(renderparams)
    else if (!isDummyPage && !isEmpty && isPreviewPage && isDuplicate)
      this.renderDuplicatePreview(renderparams)
    else if (isDummyPage && !isEmpty && !isPreviewPage)
      this.renderDummy(renderparams)
    else if (isEmpty && !isPreviewPage )
      this.renderEmpty(renderparams)
    else if (isPreviewPage && !isEmpty)
      this.renderPreview(renderparams)
    else if (isPreviewPage && isEmpty)
      this.renderEmptyPreview(renderparams)
  }
}

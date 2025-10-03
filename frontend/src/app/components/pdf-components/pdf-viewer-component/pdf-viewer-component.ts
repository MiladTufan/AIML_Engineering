import {
  Component,
  ElementRef,
  ViewChild,
  ViewContainerRef,
  HostListener,
  inject,
} from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { Subscription } from 'rxjs';
import { debounceTime, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../services/communication/session-service';
import { ImgBoxService } from '../../../services/box-services/img-box-service';
import { TextEditService } from '../../../services/box-services/text-edit-service';
import { EntityManagerService } from '../../../services/box-services/entity-manager-service';
import { MiniPage } from '../../../models/globalEdit';
import { TextBox } from '../../../models/box-models/TextBox';
import { ImgBox } from '../../../models/box-models/ImgBox';
import { Page } from '../../../models/Page';
import { PDFViewerService } from '../../../services/pdf-services/pdfviewer-service';
import { PDFFileService } from '../../../services/pdf-services/pdffile-service';
import { BoxCreationService } from '../../../services/box-services/box-creation-service';
import { DynamicContainerRegistry } from '../../../services/shared/dynamic-container-registry';
import { PdfViewerHelperService } from '../../../services/pdf-services/pdf-viewer-helper-service';
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.mjs';

//=======================================================================================================================
// Main Component handling the PDF logic.
//=======================================================================================================================
//prettier-ignore
@Component({
  selector: 'app-pdf-viewer-component',
  imports: [CommonModule],
  templateUrl: './pdf-viewer-component.html',
  styleUrl: './pdf-viewer-component.css',
})
export class PdfViewerComponent {
  //=================================================== Private variables =================================================
  private pdfDocument: any;
  private currentPageNumber: number = 1;
  private devicePixelRatio = window.devicePixelRatio || 1;
  private scale = 1.0 * this.devicePixelRatio;
  private oldScale = 0;
  private pageNumberSub!: Subscription;
  private alreadyRanObserver = false;

  private observer: any;
 
  public mouseX = 1;
  public mouseY = 1;

  //=================================================== Public variables ==================================================
  public totalPages: number = 0;
  public pdfSrc: string | Uint8Array = '';
  public renderMode = 0; // 0 = render all pages, 1 = render 1 page

  //==================================================== Children =========================================================
  @ViewChild('pdfContainer', { static: true })
  pdfContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('mousePointer', { static: true })
  follower!: ElementRef<HTMLDivElement>;
  @ViewChild('dynamicContainer', { read: ViewContainerRef })
  dynamicContainer!: ViewContainerRef;

  private fileService: PDFFileService = inject(PDFFileService);
  private sessionService: SessionService = inject(SessionService);
  private pdfViewerService: PDFViewerService = inject(PDFViewerService);
  private pdfViewerHelperService: PdfViewerHelperService = inject(PdfViewerHelperService);
  private textEditService: TextEditService = inject(TextEditService);
  private dynamicContainerRegistry: DynamicContainerRegistry = inject(DynamicContainerRegistry);

  //==================================================== Constructor ======================================================
  constructor() {
    this.pdfViewerService.renderTrigger.pipe(debounceTime(10)).subscribe((finalScale) => {
      Promise.all(
        Array.from(this.pdfViewerService.renderQueue).map((pageNumber) => {
          //prettier-ignore
          console.log('Re rendering page on zoom: ', pageNumber,' scale: ', finalScale);
          this.pdfViewerService.renderPipeline(pageNumber, finalScale, this.pdfContainer.nativeElement, false, false, false, false, 0)

          //this.pdfViewerService.renderPage(pageNumber, false, finalScale, this.pdfContainer.nativeElement);
        }),
      ).then(() => {
        this.pdfViewerService.renderQueue.clear();
      });
    });
  }

  /**
   * Angular lifecycle hook that is called once after the component is initialized.
   * Ideal for component setup, data fetching, and initial logic.
   */
  async ngOnInit() {
    this.pdfViewerService.preventWindowZoomIn();
    this.pdfViewerHelperService.currentScale = 1.0
    this.oldScale = this.pdfViewerHelperService.currentScale;
    this.loadPDF();
    this.initializeScrollEvent();
    this.subscribeToVisiblePages();
    this.pageNumberSub = this.pdfViewerService.currentPage$.subscribe((val) => {
      this.currentPageNumber = val;
    });
  }
  /**
   * Angular lifecycle hook that is called once after the component's view
   * (and all child views) has been fully initialized.
   * Useful for DOM-dependent logic and interacting with ViewChild elements.
   */
  ngAfterViewInit() {
    if (this.dynamicContainer)
      this.dynamicContainerRegistry.dynamicBoxContainer = this.dynamicContainer;
  }

  /**
   * Angular lifecycle hook that is called just before the component is destroyed.
   * Useful for cleaning up resources such as subscriptions, intervals, or event listeners.
   */
  ngOnDestroy() {
    this.pageNumberSub.unsubscribe();
    this.observer.disconnect();
  }

  /**
   * Handle scroll of user on the PDF. This functions sets the scroll listener and also implements page counting logic.
   */
  initializeScrollEvent() {
    if (this.pdfContainer) {
      this.pdfViewerService.setPDFScrollContainer(this.pdfContainer);
      this.dynamicContainerRegistry.dynamicBoxContainer = this.dynamicContainer;

      this.pdfContainer.nativeElement.addEventListener('scroll', (event) => {
      

        //prettier-ignore
        this.pdfViewerService.currentScrollTop = this.pdfContainer.nativeElement.scrollTop;
        this.currentPageNumber = this.pdfViewerService.getPageNumberFromScrolltop();
        this.pdfViewerService.setCurrentPage(this.currentPageNumber);

        if (this.pdfViewerService.isCurrentlyJumpingTopage === this.currentPageNumber)
          this.pdfViewerService.jumpToPage = false;
      });
    }
  }

  /**
   * The observer tells us which pages are currently visibile on the screen. Here we subscribe to the visibile pages
   * and render a page once it comes into the view.
   */
  subscribeToVisiblePages() {
    this.pdfViewerService.visiblePages.subscribe((set) => {
      for (const pageNum of set) {
        const page = this.pdfViewerHelperService.allRenderedPages.find((p) => p.pageNum === pageNum,);
        if (page?.currentScale != this.pdfViewerHelperService.currentScale) {
          this.pdfViewerService.renderPipeline(pageNum, this.pdfViewerHelperService.currentScale, this.pdfContainer.nativeElement, false, false,false,false, 0)

          // this.pdfViewerService.renderPage(pageNum, false, this.pdfViewerHelperService.currentScale, this.pdfContainer.nativeElement);
          console.log('re-rendering page: ', pageNum);
        }
      }
    });
  }

  /**
   * Checks if the observed pages are currently visible. If yes they are added to the VisiblePages.
   * @param entries => these entries represent pages. We need to check if they are currently in the view.
   */
  checkEntry(entries: any) {
    for (const entry of entries) {
      const id = entry.target.id;
      let pageNumber = parseInt(id?.split('-')[1]);
      const page = this.pdfViewerHelperService.getPageWithOriginalNumber(pageNumber)

      if (page)
      {
        if (page.updatePageNum != pageNumber)
          pageNumber = page.updatePageNum
      }

      if (entry.isIntersecting) {
        this.pdfViewerService.addVisiblePages(pageNumber);
        if (!this.pdfViewerHelperService.allRenderedPages.find((p) => p.pageNum === pageNumber,))

        this.pdfViewerService.renderPipeline(pageNumber, this.pdfViewerHelperService.currentScale, this.pdfContainer.nativeElement, false, false, false, false,0)
          // this.pdfViewerService.renderPage(pageNumber, false, this.pdfViewerHelperService.currentScale, this.pdfContainer.nativeElement);
      } else {
        this.pdfViewerService.removeVisiblePages(pageNumber);
      }
    }
  }

  /**
   * Creates the visible pages observer. This Observe observes all pages and tells us which pages are currently visibile
   */
  async createObserver() {
    this.alreadyRanObserver = true;
    this.observer = new IntersectionObserver(
      async (entries) => {
        this.checkEntry(entries);
      },
      {
        root: this.pdfContainer.nativeElement,
        rootMargin: '200px 0px 700px 0px', // top, right, bottom, left
        threshold: 0.01, // Trigger if at least 10% is visible
      },
    );

    requestAnimationFrame(() => {
      for (let i = 1; i <= this.totalPages; i++) {
        const pageContainer = this.pdfViewerService.getCanvasForPage(i);
        if (pageContainer) this.observer.observe(pageContainer);
      }
    });
  }

  /**
   * This helper function supports the loading of the PDF pages.
   * This function renders all pages and the creates an observer to check if the pages are currently in the view.
   * @param file => the PDF file to load.
   */
  loadingHelper(file: ArrayBuffer | File) {
    const pdfjs = pdfjsLib as any;
    const reader = new FileReader();
    reader.readAsArrayBuffer(new Blob([file]));

    reader.onload = async () => {
      const arrayBuffer = new Uint8Array(reader.result as ArrayBuffer);
      this.pdfSrc = arrayBuffer;

      const loadingTask = pdfjs.getDocument({ data: this.pdfSrc });
      this.pdfDocument = await loadingTask.promise;
      this.pdfViewerService.setPdfDocument(this.pdfDocument);
      this.totalPages = this.pdfDocument.numPages;
      const container = this.pdfContainer.nativeElement;
      container.innerHTML = ''; // Clear previous content
      this.pdfViewerService.setTotalPages(this.totalPages);
      this.pdfViewerService.setCurrentPage(1);

      if (this.renderMode == 0) {
        for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {

          this.pdfViewerService.renderPipeline(pageNum, this.pdfViewerHelperService.currentScale, this.pdfContainer.nativeElement, true, false, false, false,0).then(() => {
            if (this.pdfContainer.nativeElement.children.length === this.totalPages)
            {
              if (!this.alreadyRanObserver) this.createObserver();
            }
          })


          // this.pdfViewerService
          //   .renderPage(pageNum, true, this.pdfViewerHelperService.currentScale, this.pdfContainer.nativeElement)
          //   .then(() => {
          //     if (
          //       this.pdfContainer.nativeElement.children.length ===
          //       this.totalPages
          //     ) {
          //       if (!this.alreadyRanObserver) this.createObserver();
          //     }
          //   });
        }
      }
    };
  }

  /**
   * This function loads the user PDF. Depending on rendermode it loads all pages or only Page by Page.
   * rendermode == 0 => all pages, rendermode == 1 => only 1 page.
   * This function also makes sure that PDF is downloaded from backend if no file is specified.
   */
  async loadPDF() {
    try {
      const file = this.fileService.getFile();
      if (file) this.loadingHelper(file);
      else {
        const signed_sid =
          this.sessionService.getSessionIdFromBrowser('session_id');
        if (signed_sid) {
          this.sessionService.getPDF(signed_sid).subscribe((file) => {
            this.sessionService.getEdits(signed_sid).subscribe((edits) => {
              edits.pageEdits.forEach((element: MiniPage) => {
                element.textboxes.forEach((box) => {
                  if (box.pageId != 0)
                    this.textEditService.textboxes.push(box as TextBox);
                });
              });
              this.loadingHelper(file);
            });
          });
        } else {
          console.error('PDF_VIEWER: No signed session id!');
        }
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }

  /**
   * Calculates the translation in X and Y to use when zooming in on the cursor.
   * @param rect => parentContainer to use for offset
   * @param translateX => translation in X
   * @param translateY => translation in Y
   * @param oldScale => the old Scale that was used for previous PDF page render.
   * @param newScale => the newScale  to render the PDF page in.
   * @returns
   */
  calculateZoomTranslationCss(
    rect: DOMRect,
    translateX: number = 0,
    translateY: number = 0,
    oldScale: number = this.oldScale,
    newScale: number = this.pdfViewerHelperService.currentScale,
  ) {
    const pointer = {
      x: this.mouseX - rect.left,
      y: this.mouseY - rect.top,
    };

    const mousePointTo = {
      x: (pointer.x - translateX) / oldScale,
      y: (pointer.y - translateY) / oldScale,
    };

    translateX = pointer.x - mousePointTo.x * newScale;
    translateY = pointer.y - mousePointTo.y * newScale;

    return { tX: translateX, tY: translateY };
  }

  /**
   * Calculates the translation in X and Y to use when zooming in on the cursor.
   * @param rect => parentContainer to use for offset
   * @param translateX => translation in X
   * @param translateY => translation in Y
   * @param oldScale => the old Scale that was used for previous PDF page render.
   * @param newScale => the newScale  to render the PDF page in.
   * @returns
   */
  calculateZoomTranslationRender(
    rect: DOMRect,
    w: number,
    h: number,
    translateX: number = 0,
    translateY: number = 0,
    oldScale: number = this.oldScale,
    newScale: number = this.pdfViewerHelperService.currentScale,
  ) {
    const pointer = {
      x: (this.mouseX - rect.left) * (w / rect.width),
      y: (this.mouseY - rect.top) * (h / rect.height),
    };

    const mousePointTo = {
      x: (pointer.x - translateX) / oldScale,
      y: (pointer.y - translateY) / oldScale,
    };

    translateX = pointer.x - mousePointTo.x * newScale;
    translateY = pointer.y - mousePointTo.y * newScale;

    return { tX: translateX, tY: translateY };
  }

  /**
   * Edit the actual PDF
   */
  editActualPDF() {
    throw new Error('Not implemented');
    //============================ EXPERIMENTAL ====================================
    // use this for editing the PDF

    // text_layer.style.position = 'absolute';
    // text_layer.style.top = '0';
    // text_layer.style.left = '0';
    // text_layer.style.width = `${viewport.width}px`;
    // text_layer.style.height = `${viewport.height}px`;
    // text_layer.style.pointerEvents = 'none'; // optional, disables selection
    // text_layer.className = 'textLayer'; // optional, disables selection

    // const exists = pageContainer.querySelector(".textLayer")
    // if (exists != null) {
    // 	exists.replaceChildren()
    // 	text_layer = exists as HTMLDivElement;
    // }

    // // TODO This has all the PDF text ... use this for editing
    // page.getTextContent().then((textContent: any) => {
    // 	textContent.items.forEach((item: any) => {
    // 		const textDiv = document.createElement('div');
    // 		textDiv.textContent = item.str;

    // 		// Positionierung nach PDF Koordinaten (vereinfacht)
    // 		const tx = pdfjsLib.Util.transform(
    // 			viewport.transform,
    // 			item.transform
    // 		);

    // 		textDiv.style.position = 'absolute';
    // 		textDiv.style.left = `${tx[4]}px`;
    // 		textDiv.style.top = `${tx[5] - item.height}px`; // adjust Y
    // 		textDiv.style.fontSize = `${item.height*1.5}px`;
    // 		textDiv.style.fontFamily = item.fontName;
    // 		textDiv.style.border = '2px solid black';
    // 		textDiv.style.width = item.width;
    // 		textDiv.style.height = item.height;
    // 		textDiv.style.border = '1px dashed blue';

    // 		text_layer.appendChild(textDiv);
    // 	});
    // 	if (!exists)
    // 		pageContainer.appendChild(text_layer)

    // })

    // Annotations .. e.g. formular Felder usw.
    // page.getAnnotations().then((annotations: any) => {
    // 	console.log(annotations)
    // })

    // context.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Listen on Mouseclick over the entire Window. Used to determine mouse position on the document.
   * @param event
   */
  @HostListener('document:mousemove', ['$event'])
  trackmouse(event: MouseEvent) {
    this.mouseX = event.pageX;
    this.mouseY = event.pageY;
  }

  public zoom()
  {

  }


  /**
   * This function handles the zoom on the PDF page. It adds pages that are in visibile pages to a pdfViewerService.renderQueue.
   * @param event
   */
  async onWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();
      const delta = event.deltaY < 0 ? 0.1 : -0.1;
      const direction = event.deltaY < 0 ? 1 : -1;
      const oldScale = this.pdfViewerHelperService.currentScale;
      this.oldScale = oldScale;

      const zoomIntensity = 0.001; // smaller = slower acceleration
      const zoomFactor = Math.pow(
        1 + delta,
        -event.deltaY * zoomIntensity * direction,
      );
      let newScale = oldScale * zoomFactor;

      if (newScale > this.pdfViewerHelperService.maxScale) newScale = this.pdfViewerHelperService.maxScale;

      if (newScale < this.pdfViewerHelperService.minScale) newScale = this.pdfViewerHelperService.minScale;

      this.pdfViewerHelperService.currentScale = newScale;
      console.log(this.pdfViewerHelperService.currentScale);
      this.pdfViewerHelperService.currentScale = this.pdfViewerHelperService.currentScale;

      for (const p of this.pdfViewerService.visiblePages.getValue()) {
        this.pdfViewerService.renderQueue.add(p);

        // const canvas = (event.currentTarget as HTMLDivElement).querySelector(`#canvasContainer-${p}`) as HTMLDivElement
        // const page = this.pdfViewerService.getPageWithNumber(p)
        // if (canvas && page) {
        // 	const rect = ((event.currentTarget as HTMLDivElement).querySelector(`#pageContainer-${p}`) as HTMLDivElement).getBoundingClientRect();
        // 	let ret = this.calculateZoomTranslationCss(rect, page.translateX, page.translateY, oldScale, newScale)
        // 	page.translateX = ret.tX
        // 	page.translateY = ret.tY

        // 	canvas.style.transformOrigin = `0px 0px`;
        // 	canvas.style.transition = 'transform 0.25s ease-in-out';
        // 	canvas.style.transform = `translate(${ret.tX}px, ${ret.tY}px) scale(${this.pdfViewerHelperService.currentScale})`;
        // 	//this.cssScale = this.pdfViewerHelperService.currentScale;
        // }
      }

      this.pdfViewerService.renderTrigger.next(newScale);
      console.log(this.pdfViewerService.renderQueue);
    }
  }
}

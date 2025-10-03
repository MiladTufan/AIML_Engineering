import {
  ChangeDetectorRef,
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  inject,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { PDFViewerService } from '../../services/pdf-services/pdfviewer-service';
import { PdfViewerHelperService } from '../../services/pdf-services/pdf-viewer-helper-service';
import { Checkbox } from '../../components/shared/checkbox/checkbox';
import { OrganizeService } from '../../services/pdf-services/organize-service';
import { ThemeService } from '../../services/shared/theme-service';
import { ImageButton } from '../../components/shared/image-button/image-button';
import { DynamicContainerRegistry } from '../../services/shared/dynamic-container-registry';
import { NumberBox } from '../../components/shared/number-box/number-box';
import { CommonModule } from '@angular/common';

import {
  CdkDragDrop,
  CdkDragEnter,
  CdkDragMove,
  DragDropModule,
  transferArrayItem,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';

//prettier-ignore
@Component({
  selector: 'app-organize-view',
  imports: [Checkbox, ImageButton, CommonModule, DragDropModule],
  templateUrl: './organize-view.html',
  styleUrl: './organize-view.css',
})
export class OrganizeView {

  private pdfViewerService: PDFViewerService = inject(PDFViewerService);
  private pdfViewerHelperService: PdfViewerHelperService = inject(
    PdfViewerHelperService,
  );
  private dynamicContainerRegistry: DynamicContainerRegistry = inject(
    DynamicContainerRegistry,
  );

  private organizeService: OrganizeService = inject(OrganizeService);
  public themeService: ThemeService = inject(ThemeService);
  public addNewPageEnabled: Boolean = true;

  private observer: any;
  private alreadyRanObserver: Boolean = false;
  private numberBox!: ComponentRef<NumberBox>;
  public dragOriginIndex: number | null = null;
  public previewIndex: number | null = null; // where it would go if dropped
  private lastTargetIndex: number | null = null; 
  public swap: Boolean = false;
  public draggedItemIndex: number | null = null;

  public IsChecked: Boolean = false;

  public organizeComponentRef: any;

  public pages: any[] = [];
  public maxPagesStep: number = 20;
  public currentPageCnt: number = 0;
  private numAddedPages: number = 0;

  @ViewChild('pdfContainer', { static: true }) pdfContainer!: ElementRef<HTMLDivElement>;
  @ViewChildren('previewContainer') previewContainer!: QueryList<ElementRef<HTMLDivElement>>;

  @Output() closeEvent = new EventEmitter<void>();
  constructor(private cd: ChangeDetectorRef) {}

  /**
   * Loads Fills the pages array with the first maxPagesStep values.
   */
  ngOnInit() {
    this.currentPageCnt = this.pdfViewerService.totalPages//(this.maxPagesStep > this.pdfViewerService.totalPages) ? this.pdfViewerService.totalPages : this.maxPagesStep
    this.pages = Array.from({ length: this.currentPageCnt  }, (_, i) => ({index: i+1, isPlaceholder: false, isHidden: false}));
    this.cd.detectChanges(); 
  }

  /**
   * Renders all PDF previews
   */
  ngAfterViewInit()
  {
    for (let pageNum = 1; pageNum <= this.currentPageCnt; pageNum++)
        this.pdfViewerService.renderPipeline(pageNum, 0.2, this.previewContainer.get(pageNum-1), false, true, false, true, 0)
        // this.pdfViewerService.renderPreviewPage(pageNum, 0.2, this.previewContainer.get(pageNum-1), true, 0)
  }

  /**
   * handles the close button pressed event. Closes the Organize View
   */
  CloseBtnPressed(){
    this.closeEvent.emit();
    this.organizeService.organizerActive = false;
    this.organizeService.checkedPages.length = 0;
    for (let pageNum = 1; pageNum <= this.pdfViewerService.totalPages; pageNum++)
      this.organizeService.destroy(pageNum);
    this.organizeComponentRef.destroy();
  }

  /**
   * Loads the next maxPagesStep PDF pages. This is done so that a maximum maxPagesStep Pages are in the view at any time.
   * @returns 
   */
  loadMorePages()
  {
    const currMaxIdx = Math.max(...this.pages.map(item => item.index));
    if (currMaxIdx >= this.pdfViewerService.totalPages)
      return;

    let cntr = 0;
    this.currentPageCnt += this.numAddedPages;
    for(let i = currMaxIdx; i < this.currentPageCnt+this.maxPagesStep; i++)
    {
      if (i < this.pdfViewerService.totalPages)
      {
        this.pages.push({index: i + 1, isPlaceholder: false, isHidden: false})
        this.cd.detectChanges();
        this.pdfViewerService.renderPipeline(i + 1, 0.2, this.previewContainer.get(i), false, true, false, true, 0)
        cntr += 1
      }
    }
    this.currentPageCnt+= cntr;
  }

  /**
   * Handles the Drop event. When a user wants to rearrange the PDF pages he needs to drag and drop.
   * @param event 
   */
  onDrop(event: CdkDragDrop<string[]>) {
    if (this.dragOriginIndex !== null && this.previewIndex !== null && this.dragOriginIndex !== this.previewIndex && this.swap) {
      [this.pages[this.dragOriginIndex], this.pages[this.previewIndex]] =
        [this.pages[this.previewIndex], this.pages[this.dragOriginIndex]];
    }

    if (this.dragOriginIndex !== null &&
        this.previewIndex !== null &&
        this.swap == false &&
        this.dragOriginIndex !== this.previewIndex) {

      const item = this.pages[this.dragOriginIndex];
      
      // remove Origin index
      this.pages.splice(this.dragOriginIndex, 1);
      const insertIndex = this.dragOriginIndex < this.previewIndex ? this.previewIndex - 1 : this.previewIndex;
      this.pages.splice(insertIndex, 0, item);
    }

    this.dragOriginIndex = null;
    this.previewIndex = null;
    this.pages = this.pages.filter(i => !i.isPlaceholder);
  }

  /**
   * Handles the dragStarted event. On DragStart with mark the index where the page orginally was.
   * @param index 
   */
 dragStarted(index: number) {
    this.dragOriginIndex = index; 
    this.lastTargetIndex = index; 
    this.cd.detectChanges();
  }

  /**
   * The DragMoved event shows a opacity=0.5 overlay over the pages. This is done to mark the page the current page is dragged over.
   * @param event 
   * @returns 
   */
  dragMoved(event: CdkDragMove<any>) {
    if (this.dragOriginIndex === null) return;
    const pointer = event.pointerPosition;

    const children = Array.from(
      event.source.dropContainer.element.nativeElement.children
    ) as HTMLElement[];

    const targetIndex = children.findIndex(el => {
      const rect = el.getBoundingClientRect();
      return pointer.x > rect.left && pointer.x < rect.right &&
            pointer.y > rect.top && pointer.y < rect.bottom;
    });

    if (targetIndex !== -1 && targetIndex !== this.previewIndex) {
      this.previewIndex = targetIndex;
      // this.pages = this.pages.filter(i => !i.isPlaceholder);
      // this.pages.splice(targetIndex, 0, {index: targetIndex, isPlaceholder: true});
      // this.lastTargetIndex = targetIndex;
    }
  }


  /**
   * When the Select all checkbox is check, this function is fired. This selects all pages.
   * @param isChecked 
   */
  handleSelectAll(isChecked: Boolean) {
    if (isChecked) {
      this.organizeService.checkedPages.length = 0;
      for (
        let pageNumber = 1;
        pageNumber <= this.currentPageCnt;
        pageNumber++
      ) {
        if (!this.organizeService.checkedPages.includes(pageNumber)) {
          this.organizeService.checkedPages.push(pageNumber);
          const pageOverlayComp = this.organizeService.getCompref(pageNumber);
          pageOverlayComp?.instance.toggleActivePage(isChecked);
        }
      }
    } else {
      this.organizeService.checkedPages.forEach((pageNumber: number) => {
        const pageOverlayComp = this.organizeService.getCompref(pageNumber);
        pageOverlayComp?.instance.toggleActivePage(isChecked);
      });
      this.organizeService.checkedPages.length = 0;
    }
  }

  /**
   * This function submits all changes for processing.
   * @param event 
   */
  SubmitBtnPressed(event: Event) {
    this.closeEvent.emit();
    this.organizeService.organizerActive = false;
    this.organizeService.checkedPages.length = 0;
    for (let pageNum = 1; pageNum <= this.pdfViewerService.totalPages; pageNum++)
      this.organizeService.destroy(pageNum);
    this.organizeComponentRef.destroy();
  }

  /**
   * This function is fired when the user wants to insert a new page.
   * @param event 
   */
  AddNewPage(event: Event) {
    this.numberBox = this.dynamicContainerRegistry.dynamicAppContainer?.createComponent( NumberBox,)!;
    this.numberBox.instance.compref = this.numberBox;
    this.numberBox.instance.enteredTextEmitter.subscribe((pageNumberStr: string) => {
      if (Number(pageNumberStr) > this.pages.length)
        pageNumberStr = (this.pages.length + 1).toString();
      this.organizeService.shiftComprefs(Number(pageNumberStr));
      this.pages.splice(Number(pageNumberStr)-1, 0, {index: Number(pageNumberStr), isPlaceholder: false, isHidden: false})
      

      this.cd.detectChanges();
      this.pdfViewerService.renderPipeline(Number(pageNumberStr), 0.2, this.previewContainer.get(Number(pageNumberStr)-1), false, true, true, true, 0);
      this.numberBox.destroy();
      this.currentPageCnt+= 1
    });
  }

  /**
   * This function is fired when the user wants to rotate the pages. This rotates all currenly selected pages.
   * @param event 
   */
  rotatePage(event: Event) {
    this.organizeService.checkedPages.forEach((pageNumber: number) => {
      const pageOverlayComp = this.organizeService.getCompref(pageNumber);
      const currentRotation =
        (pageOverlayComp!.instance.currentRotation + 90) % 360;
      console.log('rotation for page: ', pageNumber, 'is: ', currentRotation);
      
      this.pdfViewerService.renderPipeline(pageNumber, 0.2, this.previewContainer.get(pageNumber-1), false, true, false, true, currentRotation)
      // this.pdfViewerService.renderPipeline(pageNumber, 0.2, this.previewContainer.get(pageNumber-1), false, true, true, true, currentRotation); // empty preview page
      
      const pageOverlayCompNew = this.organizeService.getCompref(pageNumber);
      pageOverlayCompNew!.instance.currentRotation = currentRotation;
      pageOverlayCompNew!.instance.isChecked = true;
    });
  }

  // /**
  //  * Creates the visible pages observer. This Observe observes all pages and tells us which pages are currently visibile
  //  */
  // async createObserver() {
  //   this.alreadyRanObserver = true;
  //   this.observer = new IntersectionObserver(
  //     async (entries) => {
  //       this.checkEntry(entries);
  //     },
  //     {
  //       root: this.pdfContainer.nativeElement,
  //       rootMargin: '200px 0px 700px 0px', // top, right, bottom, left
  //       threshold: 0.01, // Trigger if at least 10% is visible
  //     },
  //   );

  //   requestAnimationFrame(() => {
  //     for (let i = 1; i <= this.pdfViewerService.totalPages; i++) {
  //       const pageContainer = this.pdfViewerService.getCanvasForPage(i);
  //       if (pageContainer) this.observer.observe(pageContainer);
  //     }
  //   });
  // }

  // /**
  //  * Checks if the observed pages are currently visible. If yes they are added to the VisiblePages.
  //  * @param entries => these entries represent pages. We need to check if they are currently in the view.
  //  */
  // checkEntry(entries: any) {
  //   for (const entry of entries) {
  //     const id = entry.target.id;
  //     let pageNumber = parseInt(id?.split('-')[1]);
  //     const page =
  //       this.pdfViewerHelperService.getPageWithOriginalNumber(pageNumber);

  //     if (page) {
  //       if (page.updatePageNum != pageNumber) pageNumber = page.updatePageNum;
  //     }

  //     if (entry.isIntersecting) {
  //       this.pdfViewerService.addVisiblePages(pageNumber);
  //       if (
  //         !this.pdfViewerHelperService.allRenderedPages.find(
  //           (p) => p.pageNum === pageNumber,
  //         )
  //       )
  //         //prettier-ignore
  //         this.pdfViewerService.renderPreviewPage(pageNumber, 0.2, this.pdfContainer.nativeElement, true, 0,);
  //     } else {
  //       this.pdfViewerService.removeVisiblePages(pageNumber);
  //     }
  //   }
  // }
}

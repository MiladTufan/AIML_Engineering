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
import { RenderParams } from '../../models/Renderparams';

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
  private originPages: any[] = [];
  public maxPagesStep: number = 20;
  public currentPageCnt: number = 0;
  private numAddedPages: number = 0;
  public draggedItem: any;


  @ViewChild('pdfContainer', { static: true }) pdfContainer!: ElementRef<HTMLDivElement>;
  @ViewChildren('previewContainer') previewContainer!: QueryList<ElementRef<HTMLDivElement>>;

  @Output() closeEvent = new EventEmitter<void>();
  constructor(private cd: ChangeDetectorRef) {}
  
  /**
   * Loads Fills the pages array with the first maxPagesStep values.
   */
  ngOnInit() {
    this.currentPageCnt = this.pdfViewerService.totalPages
    this.pages = Array.from({ length: this.currentPageCnt  }, (_, i) => ({pageNumber: i+1, isPlaceholder: false, isHidden: false}));
    this.cd.detectChanges(); 
  }

  /**
   * Renders all PDF previews
   */
  ngAfterViewInit()
  {
    for (let pageNum = 1; pageNum <= this.currentPageCnt; pageNum++)
    {
      const page = this.pdfViewerHelperService.allRenderedPages.get(pageNum)
      if (page)
        this.pdfViewerService.renderPipeline(pageNum as number, 0.2, this.previewContainer.get(pageNum-1), false, true, false, true, false, true,0)
      else
        this.pdfViewerService.renderPipeline(pageNum, 0.2, this.previewContainer.get(pageNum-1), false, true, false, true, false, false, 0)
    }
        
    
    //

    this.organizeService.previewContainers = this.previewContainer
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
        this.pages.push({pageNumber: i + 1, isPlaceholder: false, isHidden: false})
        this.cd.detectChanges();
        this.pdfViewerService.renderPipeline(i + 1, 0.2, this.previewContainer.get(i), false, true, false, true, false, false,0)
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
    this.pages = [...this.originPages];

    if (this.dragOriginIndex !== null && this.previewIndex !== null && this.dragOriginIndex !== this.previewIndex && this.swap) {
        const key1 = this.dragOriginIndex+1
        const key2 = this.previewIndex+1

        const item = this.pages[this.dragOriginIndex];
        const itemNew = this.pages[this.previewIndex];
        item.pageNumber = key2
        itemNew.pageNumber = key1

        this.swapIdx(this.pages, this.dragOriginIndex, this.previewIndex )
        this.organizeService.swapComprefs(key1, key2)
    }

    if (this.dragOriginIndex !== null &&
        this.previewIndex !== null &&
        this.swap == false &&
        this.dragOriginIndex !== this.previewIndex) {

        const item = this.pages[this.dragOriginIndex];
        let offset = 0
        if (this.previewIndex >= this.pages.length)
          offset =  1
        const itemNew = this.pages[this.previewIndex - offset];
        const insertIndex = this.dragOriginIndex < this.previewIndex ? this.previewIndex - 1: this.previewIndex;

        item.pageNumber = insertIndex+2-offset
        itemNew.pageNumber = this.dragOriginIndex+1
        
        // //remove original
        this.pages.splice(this.dragOriginIndex, 1);

        // //insert new 
        this.pages.splice(insertIndex, 0, item);
        const invert = this.dragOriginIndex < insertIndex ? false : true

        const upperBound = this.dragOriginIndex < insertIndex ? insertIndex : this.dragOriginIndex
        const lowerBound = this.dragOriginIndex < insertIndex ? this.dragOriginIndex : insertIndex

        this.organizeService.shiftKeysByBound(lowerBound, upperBound, insertIndex, invert)
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
    this.draggedItem = this.pages[index]
    this.cd.detectChanges();
    this.originPages = [...this.pages];
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
      this.pages = this.pages.filter(i => !i.isPlaceholder);
      if (this.dragOriginIndex != targetIndex && !this.swap)
      {
        this.pages.splice(targetIndex, 0, {index: targetIndex, isPlaceholder: true});
        this.lastTargetIndex = targetIndex;
      }
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
    } 
    else 
    {
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
      
      const {indexPrev, adjustedPageNumber} = this.insertPage(Number(pageNumberStr))
      this.cd.detectChanges();
      this.pdfViewerService.renderPipeline(adjustedPageNumber, 0.2, 
                                           this.previewContainer.get(indexPrev), 
                                           false, true, true, true, false, false,0);
      this.numberBox.destroy();
      this.currentPageCnt+= 1
      this.organizeService.previewContainers = this.previewContainer
    });
  }

  /**
   * This function is fired when the user wants to rotate the pages. This rotates all currenly selected pages.
   * @param event 
   */
  rotatePage(event: Event) {
    this.organizeService.checkedPages.forEach((pageNumber: number) => {
      const pageOverlayComp = this.organizeService.getCompref(pageNumber);
      if (pageOverlayComp)
      {
        const currentRotation = (pageOverlayComp.instance.currentRotation + 90) % 360;
        console.log('rotation for page: ', pageNumber, 'is: ', currentRotation);
        
        const container = this.previewContainer.toArray().find(cnt => {
          const el = cnt.nativeElement.querySelector("app-page-overlay")
          const num = Number(el!.id.split("-")[1])
          if (num === pageNumber)
            return true;
          return false;
        })
        
        if (!pageOverlayComp.instance.isEmpty)
        {
          this.pdfViewerService.renderPipeline(pageOverlayComp.instance.pageNumber, 0.2, 
                                              container, 
                                              false, true, false, true, false, false,currentRotation);
        }
        else
        {
          pageOverlayComp.location.nativeElement.style.transform = `rotate(${currentRotation}deg)`;
          pageOverlayComp.location.nativeElement.style.transformOrigin = 'top left'; // pivot point
        }

        const pageOverlayCompNew = this.organizeService.getCompref(pageNumber);
        pageOverlayCompNew!.instance.currentRotation = currentRotation;
        pageOverlayCompNew!.instance.isChecked = true;
      }
    });
  }

  /**
   * Insert a page into the pages array.
   * @param pageNumber => the page to insert
   * @returns indexPrev => the index of the pageContainer.
   */
  private insertPage(pageNumber: number)
  {
    let lastItem: Boolean = false;
    if (pageNumber > this.pages.length)
    {
      pageNumber = (this.pages.length + 1);
      lastItem = true;
    }
    this.organizeService.shiftComprefs(pageNumber);

    let indexPrev = pageNumber-1
    if (lastItem)
    {
      this.pages.splice(pageNumber, 0, {pageNumber: pageNumber, 
                        isPlaceholder: false, isHidden: false})
      indexPrev = pageNumber-1
    }
    else
    {
      this.pages.splice(indexPrev, 0, {pageNumber: pageNumber, 
                        isPlaceholder: false, isHidden: false})

      this.pages.forEach((item, index) => {
        if (item.pageNumber >= pageNumber && index != indexPrev)
          item.pageNumber++;
      })
    }
    return {indexPrev: indexPrev, adjustedPageNumber: pageNumber}
  }


/**
 * Removes element at given index and shifts array
 */
removeAtIndex(arr: any[], pageNumber: number): void {
  if (pageNumber < 0 || pageNumber >= arr.length) return;

  this.organizeService.shiftComprefsRemove(pageNumber);
  const idx = arr.findIndex(item => item.pageNumber === pageNumber)
  arr.splice(idx, 1)
}


/**
 * Swaps two values in array
 */
swapIdx(arr: number[], i: number, j: number): void {
  if (i < 0 || j < 0 || i >= arr.length || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
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

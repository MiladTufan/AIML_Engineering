import {
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  inject,
  Output,
  ViewChild,
} from '@angular/core';
import { PDFViewerService } from '../../services/pdf-services/pdfviewer-service';
import { PdfViewerHelperService } from '../../services/pdf-services/pdf-viewer-helper-service';
import { Checkbox } from '../../components/shared/checkbox/checkbox';
import { OrganizeService } from '../../services/pdf-services/organize-service';
import { ThemeService } from '../../services/shared/theme-service';
import { ImageButton } from '../../components/shared/image-button/image-button';
import { DynamicContainerRegistry } from '../../services/shared/dynamic-container-registry';
import { NumberBox } from '../../components/shared/number-box/number-box';

@Component({
  selector: 'app-organize-view',
  imports: [Checkbox, ImageButton],
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

  public IsChecked: Boolean = false;

  public organizeComponentRef: any;

  @ViewChild('pdfContainer', { static: true })
  pdfContainer!: ElementRef<HTMLDivElement>;

  @Output() closeEvent = new EventEmitter<void>();

  //prettier-ignore
  ngAfterViewInit()
  {
     for (let pageNum = 1; pageNum <= this.pdfViewerService.totalPages; pageNum++) {
          this.pdfViewerService
            .renderPreviewPage(pageNum, 0.2, this.pdfContainer, true, 0)
            .then(() => {
              if (
                this.pdfContainer.nativeElement.children.length ===
                this.pdfViewerService.totalPages
              ) {
                // if (!this.alreadyRanObserver) this.createObserver();
              }
            });
        }
  }

  handleSelectAll(isChecked: Boolean) {
    if (isChecked) {
      this.organizeService.checkedPages.length = 0;
      for (
        let pageNumber = 1;
        pageNumber <= this.pdfViewerService.totalPages;
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

  SubmitBtnPressed(event: Event) {
    this.closeEvent.emit();
    this.organizeService.organizerActive = false;
    this.organizeService.checkedPages.length = 0;
    this.organizeComponentRef.destroy();
  }

  //prettier-ignore
  AddNewPage(event: Event) {
    this.numberBox = this.dynamicContainerRegistry.dynamicAppContainer?.createComponent( NumberBox,)!;
    this.numberBox.instance.compref = this.numberBox;
    this.numberBox.instance.enteredTextEmitter.subscribe((pageNumberStr: string) => {
      this.pdfViewerService.createSpaceForPage(this.pdfContainer, "PageOverlay", Number(pageNumberStr));
      //this.pdfViewerService.renderPreviewPage(Number(pageNumberStr), 0.2, this.pdfContainer, true, 0, true);
      this.numberBox.destroy();
    });
  }

  rotatePage(event: Event) {
    this.organizeService.checkedPages.forEach((pageNumber: number) => {
      const pageOverlayComp = this.organizeService.getCompref(pageNumber);
      const currentRotation =
        (pageOverlayComp!.instance.currentRotation + 90) % 360;
      console.log('rotation for page: ', pageNumber, 'is: ', currentRotation);

      //prettier-ignore
      this.pdfViewerService.renderPreviewPage(pageNumber, 0.2, this.pdfContainer, true, currentRotation)
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

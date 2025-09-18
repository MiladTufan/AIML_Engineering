import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { PDFViewerService } from '../../services/pdf-services/pdfviewer-service';
import { PdfViewerHelperService } from '../../services/pdf-services/pdf-viewer-helper-service';

@Component({
  selector: 'app-organize-view',
  imports: [],
  templateUrl: './organize-view.html',
  styleUrl: './organize-view.css',
})
export class OrganizeView {
  private pdfViewerService: PDFViewerService = inject(PDFViewerService);
  private pdfViewerHelperService: PdfViewerHelperService = inject(
    PdfViewerHelperService,
  );

  private observer: any;
  private alreadyRanObserver: Boolean = false;

  @ViewChild('pdfContainer', { static: true })
  pdfContainer!: ElementRef<HTMLDivElement>;

  //prettier-ignore
  ngAfterViewInit()
  {
     for (let pageNum = 1; pageNum <= this.pdfViewerService.totalPages; pageNum++) {
          this.pdfViewerService
            .renderPage(pageNum, false, true, 0.2, this.pdfContainer, true)
            .then(() => {
              if (
                this.pdfContainer.nativeElement.children.length ===
                this.pdfViewerService.totalPages
              ) {
                if (!this.alreadyRanObserver) this.createObserver();
              }
            });
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
      for (let i = 1; i <= this.pdfViewerService.totalPages; i++) {
        const pageContainer = this.pdfViewerService.getCanvasForPage(i);
        if (pageContainer) this.observer.observe(pageContainer);
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
      const page =
        this.pdfViewerHelperService.getPageWithOriginalNumber(pageNumber);

      if (page) {
        if (page.updatePageNum != pageNumber) pageNumber = page.updatePageNum;
      }

      if (entry.isIntersecting) {
        this.pdfViewerService.addVisiblePages(pageNumber);
        if (
          !this.pdfViewerHelperService.allRenderedPages.find(
            (p) => p.pageNum === pageNumber,
          )
        )
          this.pdfViewerService.renderPage(
            pageNumber,
            false,
            false,
            0.2,
            this.pdfContainer.nativeElement,
          );
      } else {
        this.pdfViewerService.removeVisiblePages(pageNumber);
      }
    }
  }
}

import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { PDFViewerService } from '../../../services/pdf-services/pdfviewer-service';
import { map } from 'rxjs/operators';
import { PdfViewerHelperService } from '../../../services/pdf-services/pdf-viewer-helper-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navigator-component',
  imports: [],
  templateUrl: './navigator-component.html',
  styleUrl: './navigator-component.css',
})
export class NavigatorComponent {
  private renderedPreviews: number[] = [];
  private pageNumberSub!: Subscription;

  @ViewChild('pdfPreviewContainer', { static: true })
  pdfPreviewContainer!: ElementRef<HTMLDivElement>;

  private pdfViewerService: PDFViewerService = inject(PDFViewerService);
  private pdfViewerHelperService: PdfViewerHelperService = inject(
    PdfViewerHelperService,
  );

  ngAfterViewInit() {
    this.pageNumberSub = this.pdfViewerService.currentPage$.subscribe((val) => {
      if (!this.pdfViewerService.jumpToPage) {
        this.pdfPreviewContainer.nativeElement.scrollTop =
          this.pdfViewerService.calcTargetScrolltop(val, true);
      }
    });

    this.pdfViewerService.visiblePages.subscribe((set) => {
      for (const pageNum of set) {
        const page = this.pdfViewerHelperService.allRenderedPages.find(
          (p) => p.pageNum === pageNum,
        );

        //prettier-ignore
        if (!this.renderedPreviews.includes(pageNum))
        {
          this.renderedPreviews.push(pageNum)
          this.pdfViewerService.renderPage(pageNum, false, true, 0.2, this.pdfPreviewContainer.nativeElement);
          console.log('Rendering Page Preview: ', pageNum);
        }
      }
    });
  }
}

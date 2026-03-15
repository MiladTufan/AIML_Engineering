import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { PDFViewerService } from '../../../services/pdf-services/pdfviewer-service';
import { map } from 'rxjs/operators';
import { PdfViewerHelperService } from '../../../services/pdf-services/pdf-viewer-helper-service';
import { Subscription } from 'rxjs';
import { OrganizeService } from '../../../services/pdf-services/organize-service';
import { EventBusService } from '../../../services/communication/event-bus-service';
import { Constants } from '../../../models/constants/constants';
//prettier-ignore
@Component({
  selector: 'app-navigator-component',
  imports: [],
  templateUrl: './navigator-component.html',
  styleUrl: './navigator-component.css',
})
export class NavigatorComponent {
  private renderedPreviews: number[] = [];
  private receivedPageNumbers = new Set<number>();

  private lastRenderedPage: number = 0;

  private pageNumberSub!: Subscription;

  @ViewChild('pdfPreviewContainer', { static: true })
  pdfPreviewContainer!: ElementRef<HTMLDivElement>;

  private pdfViewerService: PDFViewerService = inject(PDFViewerService);
  private pdfViewerHelperService: PdfViewerHelperService = inject(
    PdfViewerHelperService,
  );

  private organizeService: OrganizeService = inject(OrganizeService);
  private eventBusService: EventBusService = inject(EventBusService);

  ngOnInit() {
    this.eventBusService
      .on(Constants.EVENT_PAGE_RENDERED)
      .subscribe((payload: any) => {
        const pageNumber: number = payload.pageNumber;
        this.receivedPageNumbers.add(pageNumber);

        // TODO: When rendering is slow these pages are not in the correct order.
        // if (
        //   this.lastRenderedPage + 1 === pageNumber ||
        //   payload.updated === true
        // ) {
          //prettier-ignore
          if (!this.renderedPreviews.includes(pageNumber) && payload.updated === false)
          {
            this.renderInitialPreview(pageNumber)
          }
          else if (payload.updated === true)
          {
            this.pdfViewerService.renderPipeline(payload.pageNumber as number, 0.2, this.pdfPreviewContainer, false, true, false, false, true, true,0)
          }
        // }
      });
  }

  //prettier-ignore
  renderInitialPreview(pageNumber: number)
  {
    this.renderedPreviews.push(pageNumber)
    this.lastRenderedPage = pageNumber;
    this.pdfViewerService.renderPipeline(pageNumber, 0.2, this.pdfPreviewContainer, false, true, false, false, true, true,0)
  }

  ngAfterViewInit() {
    this.pageNumberSub = this.pdfViewerService.currentPage$.subscribe((val) => {
      if (
        !this.pdfViewerService.jumpToPage &&
        !this.organizeService.organizerActive
      ) {
        this.pdfPreviewContainer.nativeElement.scrollTop =
          this.pdfViewerService.calcTargetScrolltop(val, true);
      }
    });
  }
}

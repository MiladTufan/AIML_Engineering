import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { PDFViewerService } from '../../../services/pdf-services/pdfviewer-service';
import { map } from 'rxjs/operators';
import { PdfViewerHelperService } from '../../../services/pdf-services/pdf-viewer-helper-service';
import { Subscription } from 'rxjs';
import { OrganizeService } from '../../../services/pdf-services/organize-service';
import { EventBusService } from '../../../services/communication/event-bus-service';
import { Constants } from '../../../models/constants/constants';

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

  private organizeService: OrganizeService = inject(OrganizeService);
  private eventBusService: EventBusService = inject(EventBusService);

  ngOnInit() {
    this.eventBusService
      .on(Constants.EVENT_PAGE_RENDERED)
      .subscribe((payload: any) => {
        //prettier-ignore
        if (!this.renderedPreviews.includes(payload.pageNumber as number))
        {
          this.renderedPreviews.push(payload.pageNumber as number)
          this.pdfViewerService.renderPipeline(payload.pageNumber as number, 0.2, this.pdfPreviewContainer, false, true, false, false, true, true,0)
          console.log('Rendering Page Preview: ', payload.pageNumber);
        }
        else if (payload.updated === true)
        {
          this.pdfViewerService.renderPipeline(payload.pageNumber as number, 0.2, this.pdfPreviewContainer, false, true, false, false, true, true,0)
        }
      });
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

  initNavigator() {
    this.pdfViewerService.visiblePages.subscribe((set) => {
      for (const pageNum of set) {
        const page = this.pdfViewerHelperService.getPageWithNumber(pageNum);

        //prettier-ignore
        if (!this.renderedPreviews.includes(pageNum))
        {
          this.renderedPreviews.push(pageNum)
          this.pdfViewerService.renderPipeline(pageNum, 0.2, this.pdfPreviewContainer, false, true, false, false, true, false,0)
          console.log('Rendering Page Preview: ', pageNum);
        }
      }
    });
  }
}

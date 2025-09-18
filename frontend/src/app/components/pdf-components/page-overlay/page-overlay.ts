import { Component, inject, Input } from '@angular/core';
import { PageInfoComponent } from '../page-info-component/page-info-component';
import { PDFViewerService } from '../../../services/pdf-services/pdfviewer-service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { PdfViewerHelperService } from '../../../services/pdf-services/pdf-viewer-helper-service';

@Component({
  selector: 'app-page-overlay',
  imports: [PageInfoComponent, CommonModule],
  templateUrl: './page-overlay.html',
  styleUrl: './page-overlay.css',
})
export class PageOverlay {
  @Input() pageNumber: number = 1;
  @Input() IsOrganizePreview: Boolean = false;

  private currentPage: number = 1;
  private pageNumberSub!: Subscription;

  public isActivePage: Boolean = false;
  public isChecked: Boolean = false;
  public isPageDeleted: Boolean = false;

  private pdfViewerService: PDFViewerService = inject(PDFViewerService);
  public pdfViewerHelperService: PdfViewerHelperService = inject(
    PdfViewerHelperService,
  );

  ngAfterViewInit() {
    this.pageNumberSub = this.pdfViewerService.currentPage$.subscribe((val) => {
      this.currentPage = val;

      //prettier-ignore
      setTimeout(() => {
          if (this.currentPage === this.pageNumber) 
            this.isActivePage = true;
          else 
            this.isActivePage = false;
      });
    });
  }

  toggleActivePage(checked: Boolean) {
    this.isChecked = checked;
  }

  handlePageDeleted(payload: { pageNumber: number; deleted: Boolean }) {
    this.isPageDeleted = payload.deleted;
  }
}

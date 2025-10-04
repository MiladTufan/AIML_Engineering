import { Component, inject, Input } from '@angular/core';
import { PageInfoComponent } from '../page-info-component/page-info-component';
import { PDFViewerService } from '../../../services/pdf-services/pdfviewer-service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { PdfViewerHelperService } from '../../../services/pdf-services/pdf-viewer-helper-service';
import { ThemeService } from '../../../services/shared/theme-service';
import { OrganizeService } from '../../../services/pdf-services/organize-service';

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

  public currentRotation: number = 0;
  public isEmpty: Boolean = false;

  private pdfViewerService: PDFViewerService = inject(PDFViewerService);
  public themeService: ThemeService = inject(ThemeService);
  private organizeService: OrganizeService = inject(OrganizeService);

  ngAfterViewInit() {
    this.pageNumberSub = this.pdfViewerService.currentPage$.subscribe((val) => {
      this.currentPage = val;

      //prettier-ignore
      setTimeout(() => {
          if (this.currentPage === this.pageNumber && !this.organizeService.organizerActive) 
            this.isActivePage = true;
          else 
            this.isActivePage = false;
      });
    });
  }

  toggleActivePage(checked: Boolean) {
    this.isChecked = checked;
    if (checked) {
      if (!this.organizeService.checkedPages.includes(this.pageNumber))
        this.organizeService.checkedPages.push(this.pageNumber);

      this.organizeService.deletedPages.splice(
        this.organizeService.deletedPages.indexOf(this.pageNumber),
        1,
      );
      this.isPageDeleted = false;
    }
  }

  handlePageDeleted(payload: { pageNumber: number; deleted: Boolean }) {
    this.isPageDeleted = payload.deleted;
    if (payload.deleted) {
      this.organizeService.checkedPages.splice(
        this.organizeService.checkedPages.indexOf(this.pageNumber),
        1,
      );

      this.organizeService.deletedPages.push(this.pageNumber);
      this.isChecked = false;
    } else {
      this.organizeService.deletedPages.splice(
        this.organizeService.deletedPages.indexOf(payload.pageNumber),
        1,
      );
    }
  }
}

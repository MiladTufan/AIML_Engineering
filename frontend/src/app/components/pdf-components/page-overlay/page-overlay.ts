import { Component, inject, Input } from '@angular/core';
import { PageInfoComponent } from '../page-info-component/page-info-component';
import { PDFViewerService } from '../../../services/pdf-services/pdfviewer-service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-overlay',
  imports: [PageInfoComponent, CommonModule],
  templateUrl: './page-overlay.html',
  styleUrl: './page-overlay.css',
})
export class PageOverlay {
  @Input() pageNumber: number = 1;

  private currentPage: number = 1;
  private pageNumberSub!: Subscription;

  public isActivePage: Boolean = false;

  private pdfViewerService: PDFViewerService = inject(PDFViewerService);

  ngAfterViewInit() {
    this.pageNumberSub = this.pdfViewerService.currentPage$.subscribe((val) => {
      this.currentPage = val;

      //prettier-ignore
      if (this.currentPage === this.pageNumber) 
        this.isActivePage = true;
      else 
        this.isActivePage = false;
    });
  }
}

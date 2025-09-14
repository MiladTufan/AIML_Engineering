import { Component, inject, Input } from '@angular/core';
import { ThemeService } from '../../../services/shared/theme-service';
import { PDFViewerService } from '../../../services/pdf-services/pdfviewer-service';
import { PdfViewerHelperService } from '../../../services/pdf-services/pdf-viewer-helper-service';

@Component({
  selector: 'app-page-info-component',
  imports: [],
  templateUrl: './page-info-component.html',
  styleUrl: './page-info-component.css',
})
export class PageInfoComponent {
  @Input() pageNumber: number = 1;
  @Input() width: number = 60;
  @Input() fontSize: number = 32;
  @Input() borderRadius: number = 9;

  public themeService: ThemeService = inject(ThemeService);
  public pdfViewerService: PDFViewerService = inject(PDFViewerService);
  public pdfViewerHelperService: PdfViewerHelperService = inject(
    PdfViewerHelperService,
  );

  ShowInfo(event: Event) {}

  DeletePage(event: Event) {
    this.pdfViewerService.deletePage(this.pageNumber);
  }

  MovePage(event: Event) {}
}

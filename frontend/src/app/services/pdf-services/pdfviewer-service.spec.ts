import { TestBed } from '@angular/core/testing';

import { PDFViewerService } from './pdfviewer-service';

describe('PDFViewerService', () => {
  let service: PDFViewerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PDFViewerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

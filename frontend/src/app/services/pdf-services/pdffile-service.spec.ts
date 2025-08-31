import { TestBed } from '@angular/core/testing';

import { PDFFileService } from './pdffile-service';

describe('PDFFileService', () => {
  let service: PDFFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PDFFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

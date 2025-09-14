import { TestBed } from '@angular/core/testing';

import { PdfViewerHelperService } from './pdf-viewer-helper-service';

describe('PdfViewerHelperService', () => {
  let service: PdfViewerHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfViewerHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

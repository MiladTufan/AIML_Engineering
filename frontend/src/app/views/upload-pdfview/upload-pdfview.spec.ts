import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadPDFView } from './upload-pdfview';

describe('UploadPDFView', () => {
  let component: UploadPDFView;
  let fixture: ComponentFixture<UploadPDFView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadPDFView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadPDFView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

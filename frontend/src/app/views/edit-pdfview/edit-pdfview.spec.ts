import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPDFView } from './edit-pdfview';

describe('EditPDFView', () => {
  let component: EditPDFView;
  let fixture: ComponentFixture<EditPDFView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPDFView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPDFView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextStyleEditorComponent } from './text-style-editor-component';

describe('TextStyleEditorComponent', () => {
  let component: TextStyleEditorComponent;
  let fixture: ComponentFixture<TextStyleEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextStyleEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextStyleEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

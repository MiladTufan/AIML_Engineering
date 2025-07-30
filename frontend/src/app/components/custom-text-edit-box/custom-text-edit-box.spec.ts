import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomTextEditBox } from './custom-text-edit-box';

describe('CustomTextEditBox', () => {
  let component: CustomTextEditBox;
  let fixture: ComponentFixture<CustomTextEditBox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomTextEditBox]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomTextEditBox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

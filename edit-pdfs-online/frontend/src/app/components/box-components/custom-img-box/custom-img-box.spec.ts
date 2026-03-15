import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomImgBox } from './custom-img-box';

describe('CustomImgBox', () => {
  let component: CustomImgBox;
  let fixture: ComponentFixture<CustomImgBox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomImgBox]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomImgBox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

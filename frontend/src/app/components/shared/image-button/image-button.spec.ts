import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageButton } from './image-button';

describe('ImageButton', () => {
  let component: ImageButton;
  let fixture: ComponentFixture<ImageButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

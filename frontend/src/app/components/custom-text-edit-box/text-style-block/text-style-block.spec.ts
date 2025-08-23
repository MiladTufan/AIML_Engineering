import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextStyleBlock } from './text-style-block';

describe('TextStyleBlock', () => {
  let component: TextStyleBlock;
  let fixture: ComponentFixture<TextStyleBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextStyleBlock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextStyleBlock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

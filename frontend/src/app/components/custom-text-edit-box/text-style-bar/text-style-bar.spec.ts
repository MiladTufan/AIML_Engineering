import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextStyleBar } from './text-style-bar';

describe('TextStyleBar', () => {
  let component: TextStyleBar;
  let fixture: ComponentFixture<TextStyleBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextStyleBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextStyleBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

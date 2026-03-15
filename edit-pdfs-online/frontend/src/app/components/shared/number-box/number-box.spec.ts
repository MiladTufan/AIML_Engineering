import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberBox } from './number-box';

describe('NumberBox', () => {
  let component: NumberBox;
  let fixture: ComponentFixture<NumberBox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberBox]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumberBox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

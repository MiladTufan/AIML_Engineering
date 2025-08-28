import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonBoxObject } from './common-box-object';

describe('CommonBoxObject', () => {
  let component: CommonBoxObject;
  let fixture: ComponentFixture<CommonBoxObject>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonBoxObject]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonBoxObject);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

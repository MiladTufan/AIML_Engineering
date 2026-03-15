import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoomController } from './zoom-controller';

describe('ZoomController', () => {
  let component: ZoomController;
  let fixture: ComponentFixture<ZoomController>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoomController]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZoomController);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

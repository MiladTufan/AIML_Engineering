import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletionView } from './deletion-view';

describe('DeletionView', () => {
  let component: DeletionView;
  let fixture: ComponentFixture<DeletionView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletionView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletionView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

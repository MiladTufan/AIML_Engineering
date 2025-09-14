import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageOverlay } from './page-overlay';

describe('PageOverlay', () => {
  let component: PageOverlay;
  let fixture: ComponentFixture<PageOverlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageOverlay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageOverlay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizeView } from './organize-view';

describe('OrganizeView', () => {
  let component: OrganizeView;
  let fixture: ComponentFixture<OrganizeView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizeView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizeView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

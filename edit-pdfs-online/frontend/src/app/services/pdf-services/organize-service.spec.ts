import { TestBed } from '@angular/core/testing';

import { OrganizeService } from './organize-service';

describe('OrganizeService', () => {
  let service: OrganizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganizeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { BoxCreationService } from './box-creation-service';

describe('BoxCreationService', () => {
  let service: BoxCreationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoxCreationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

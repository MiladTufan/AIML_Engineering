import { TestBed } from '@angular/core/testing';

import { TextEditService } from './text-edit-service';

describe('TextEditService', () => {
  let service: TextEditService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextEditService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

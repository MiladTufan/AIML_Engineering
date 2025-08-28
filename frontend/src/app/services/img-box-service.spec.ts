import { TestBed } from '@angular/core/testing';

import { ImgBoxService } from './img-box-service';

describe('ImgBoxService', () => {
  let service: ImgBoxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImgBoxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

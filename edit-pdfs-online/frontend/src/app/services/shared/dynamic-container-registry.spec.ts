import { TestBed } from '@angular/core/testing';

import { DynamicContainerRegistry } from './dynamic-container-registry';

describe('DynamicContainerRegistry', () => {
  let service: DynamicContainerRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicContainerRegistry);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

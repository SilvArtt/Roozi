import { TestBed } from '@angular/core/testing';

import { BlockRequestService } from './block-request-service';

describe('BlockRequestService', () => {
  let service: BlockRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BlockRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { OperatorRequestService } from './operator-request-service';

describe('OperatorRequestService', () => {
  let service: OperatorRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OperatorRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

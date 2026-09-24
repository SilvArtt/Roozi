import { TestBed } from '@angular/core/testing';

import { OperatorCardService } from './operator-card-service';

describe('OperatorCardService', () => {
  let service: OperatorCardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OperatorCardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

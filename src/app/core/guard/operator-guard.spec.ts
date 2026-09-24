import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { operatorGuard } from './operator-guard';

describe('operatorGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => operatorGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

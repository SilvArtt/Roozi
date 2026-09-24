import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bloqueio } from './bloqueio';

describe('Bloqueio', () => {
  let component: Bloqueio;
  let fixture: ComponentFixture<Bloqueio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bloqueio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Bloqueio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

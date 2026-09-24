import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Solicitacao } from './solicitacao';

describe('Solicitacao', () => {
  let component: Solicitacao;
  let fixture: ComponentFixture<Solicitacao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Solicitacao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Solicitacao);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

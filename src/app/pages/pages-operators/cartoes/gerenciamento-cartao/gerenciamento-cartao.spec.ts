import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GerenciamentoCartao } from './gerenciamento-cartao';

describe('GerenciamentoCartao', () => {
  let component: GerenciamentoCartao;
  let fixture: ComponentFixture<GerenciamentoCartao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GerenciamentoCartao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GerenciamentoCartao);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

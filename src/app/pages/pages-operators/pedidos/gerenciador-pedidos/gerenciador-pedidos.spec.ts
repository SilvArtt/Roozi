import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GerenciadorPedidos } from './gerenciador-pedidos';

describe('GerenciadorPedidos', () => {
  let component: GerenciadorPedidos;
  let fixture: ComponentFixture<GerenciadorPedidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GerenciadorPedidos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GerenciadorPedidos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

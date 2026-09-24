import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpcoesCardBox } from './opcoes-card-box';

describe('OpcoesCardBox', () => {
  let component: OpcoesCardBox;
  let fixture: ComponentFixture<OpcoesCardBox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpcoesCardBox]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpcoesCardBox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

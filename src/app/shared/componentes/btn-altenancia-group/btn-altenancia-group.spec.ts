import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BtnAltenanciaGroup } from './btn-altenancia-group';

describe('BtnAltenanciaGroup', () => {
  let component: BtnAltenanciaGroup;
  let fixture: ComponentFixture<BtnAltenanciaGroup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BtnAltenanciaGroup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BtnAltenanciaGroup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

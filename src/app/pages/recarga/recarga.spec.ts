import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Recarga } from './recarga';

describe('Recarga', () => {
  let component: Recarga;
  let fixture: ComponentFixture<Recarga>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recarga]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Recarga);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardModel } from './card-model';

describe('CardModel', () => {
  let component: CardModel;
  let fixture: ComponentFixture<CardModel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardModel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardModel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

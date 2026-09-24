import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderPadrao } from './header-padrao';

describe('HeaderPadrao', () => {
  let component: HeaderPadrao;
  let fixture: ComponentFixture<HeaderPadrao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderPadrao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderPadrao);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

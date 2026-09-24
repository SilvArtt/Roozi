import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderOperadora } from './header-operadora';

describe('HeaderOperadora', () => {
  let component: HeaderOperadora;
  let fixture: ComponentFixture<HeaderOperadora>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderOperadora]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderOperadora);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoSelector } from './tipo-selector';

describe('TipoSelector', () => {
  let component: TipoSelector;
  let fixture: ComponentFixture<TipoSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

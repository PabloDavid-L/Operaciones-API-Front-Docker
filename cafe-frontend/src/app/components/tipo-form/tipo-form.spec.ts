import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoForm } from './tipo-form';

describe('TipoForm', () => {
  let component: TipoForm;
  let fixture: ComponentFixture<TipoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

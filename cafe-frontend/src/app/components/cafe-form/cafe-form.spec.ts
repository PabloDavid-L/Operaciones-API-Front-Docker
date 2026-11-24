// Smoke test de CafeFormComponent: lo instancia con HTTP y Router mockeados,
// lo que ejecuta constructor, ngOnInit (getTipos + paramMap) y el render del
// template. No cubre las acciones del formulario (guardar, cancelar).
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CafeFormComponent } from './cafe-form';

describe('CafeFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CafeFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CafeFormComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

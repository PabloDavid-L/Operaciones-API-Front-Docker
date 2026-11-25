// Smoke test de CafeListComponent: lo instancia con HTTP y Router mockeados,
// lo que ejecuta constructor, ngOnInit (carga de cafés) y el render del
// template. No cubre eliminar() ni el manejo de errores.
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CafeListComponent } from './cafe-list';

describe('CafeListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CafeListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CafeListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

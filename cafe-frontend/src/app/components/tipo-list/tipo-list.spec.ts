// Smoke test de TipoListComponent: lo instancia con HTTP y Router mockeados,
// lo que ejecuta constructor, ngOnInit (carga de tipos) y el render del
// template. No cubre eliminar() ni el manejo de errores.
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TipoListComponent } from './tipo-list';

describe('TipoListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TipoListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

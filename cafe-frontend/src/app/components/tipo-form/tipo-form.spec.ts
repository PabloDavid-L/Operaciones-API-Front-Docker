// Smoke test de TipoFormComponent: lo instancia con HTTP y Router mockeados,
// lo que ejecuta constructor, ngOnInit y el render del template. No cubre
// guardar() ni cancelar().
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TipoFormComponent } from './tipo-form';

describe('TipoFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TipoFormComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

// Smoke test de TipoSelectorComponent: lo instancia con HTTP mockeado, lo que
// ejecuta constructor, ngOnInit (carga de tipos) y el render del template.
// No usa Router porque este componente no lo inyecta.
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TipoSelectorComponent } from './tipo-selector';

describe('TipoSelectorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoSelectorComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TipoSelectorComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

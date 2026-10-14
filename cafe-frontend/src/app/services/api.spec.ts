// src/app/services/api.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api';
import { Tipo } from '../interfaces/tipo.interface';
import { CreateTipoDto } from '../interfaces/create-tipo.dto';
import { environment } from '../../environments/environment';

describe('ApiService - Tests básicos Tipo (GET y CREATE)', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  // Datos de prueba simples
  const mockTipos: Tipo[] = [
    { id: 1, name: 'Espresso', description: 'Café espresso puro' },
    { id: 2, name: 'Granos', description: 'Tipos de granos de café' },
  ];

  const mockCreateTipoDto: CreateTipoDto = {
    name: 'Nuevo Tipo',
    description: 'Descripción del nuevo tipo',
  };

  const mockCreatedTipo: Tipo = {
    id: 3,
    name: 'Nuevo Tipo',
    description: 'Descripción del nuevo tipo',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica que no queden peticiones pendientes
  });

  // ── TEST 1: GET /tipos ─────────────────────────────────────────
  it('debe obtener lista de tipos con GET /tipos', () => {
    let result: Tipo[] | undefined;

    // ACT: Llamamos al método del servicio
    service.getTipos().subscribe((data) => (result = data));

    // ASSERT: Verificamos la petición HTTP
    const req = httpMock.expectOne(`${baseUrl}/tipos`);
    expect(req.request.method).toBe('GET');

    // Respondemos con datos simulados
    req.flush(mockTipos);

    // Verificamos el resultado
    expect(result).toEqual(mockTipos);
    expect(result!.length).toBe(2);
    expect(result![0].name).toBe('Espresso');
  });

  // ── TEST 2: POST /tipos (CREATE) ───────────────────────────────
  it('debe crear un tipo con POST /tipos', () => {
    let result: Tipo | undefined;

    // ACT: Llamamos al método createTipo con el DTO
    service.createTipo(mockCreateTipoDto).subscribe((data) => (result = data));

    // ASSERT: Verificamos la petición HTTP
    const req = httpMock.expectOne(`${baseUrl}/tipos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockCreateTipoDto);

    // Respondemos con el tipo creado (simulando respuesta del servidor con ID)
    req.flush(mockCreatedTipo);

    // Verificamos el resultado
    expect(result).toEqual(mockCreatedTipo);
    expect(result!.id).toBe(3); // ID asignado por el "servidor"
    expect(result!.name).toBe('Nuevo Tipo');
  });
});
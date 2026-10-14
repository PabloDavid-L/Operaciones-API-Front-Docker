import { Test, TestingModule } from '@nestjs/testing';
import { TiposController } from './tipos.controller';
import { TiposService } from './tipos.service';
import { CreateTipoDto } from './dto/create-tipo.dto';

// ══════════════════════════════════════════════════════════════
// TESTS UNITARIOS de TiposController
//
// ¿Cómo funcionan?
// Se basan en el patrón MOCK (simulación). Nunca tocan la base
// de datos ni el servicio real.
//
// 1. Se crea un objeto mockService con funciones vacías (jest.fn())
//    que registran si fueron llamadas y con qué argumentos.
// 2. Se reemplaza el TiposService real por este mock al construir
//    el módulo de prueba (useValue: mockService).
// 3. Se ejecuta el método del controller y se verifica que:
//    - Llamó al servicio con los argumentos correctos
//    - Devolvió el resultado que el servicio le devolvió
//
// Estos tests NO necesitan PostgreSQL porque el servicio está
// reemplazado por un mock. La cadena de dependencias nunca llega
// a TypeORM ni a la base de datos.
// ══════════════════════════════════════════════════════════════
describe('TiposController - Unit Tests', () => {
  let controller: TiposController;
  let service: TiposService;

  // Mock del servicio: funciones vacías que registran sus llamadas.
  // jest.fn() crea una función falsa que no hace nada pero guarda
  // registro de si fue llamada y con qué argumentos.
  const mockService = {
    create: jest.fn(),
    remove: jest.fn(),
  };

  // Se ejecuta antes de CADA test:
  // 1. Crea un módulo de prueba con el controller real y el mock del servicio
  // 2. Cuando NestJS construye TiposController, le inyecta el mock en vez del servicio real
  // 3. jest.clearAllMocks() limpia el registro de llamadas para que cada test empiece limpio
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiposController],
      providers: [{ provide: TiposService, useValue: mockService }],
    }).compile();

    controller = module.get<TiposController>(TiposController);
    service = module.get<TiposService>(TiposService);
    jest.clearAllMocks();
  });

  describe('POST /tipos - create', () => {
    it('debe crear un tipo llamando al servicio con el DTO', async () => {
      // ── ARRANGE: Preparar datos y configurar el mock ──────
      // createTipoDto: lo que enviaríamos como petición HTTP
      const createTipoDto: CreateTipoDto = {
        name: 'Espresso',
        description: 'Café espresso puro',
      };
      // expectedTipo: lo que esperamos que el servicio devuelva
      const expectedTipo = {
        id: 1,
        name: 'Espresso',
        description: 'Café espresso puro',
      };
      // Configura el mock para que cuando lo llamen, devuelva expectedTipo
      // como si hubiera creado el registro en la base de datos
      mockService.create.mockResolvedValue(expectedTipo);

      // ── ACT: Ejecutar el método del controller ────────────
      // El controller recibe el DTO y llama a service.create(dto).
      // Pero service es el mock, así que devuelve expectedTipo.
      const result = await controller.create(createTipoDto);

      // ── ASSERT: Verificar resultados ──────────────────────
      // Verifica que el mock FUE llamado con el DTO correcto.
      // Si el controller no llamara al servicio, o lo llamara con
      // otros datos, este expect FALLARÍA.
      expect(service.create).toHaveBeenCalledWith(createTipoDto);
      // Verifica que el resultado devuelto es exactamente el esperado
      expect(result).toEqual(expectedTipo);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Espresso');
    });
  });

  describe('DELETE /tipos/:id - remove', () => {
    it('debe eliminar un tipo llamando al servicio con el id numérico', async () => {
      // ── ARRANGE: Preparar datos y configurar el mock ──────
      // tipoId es string porque así llega de la URL (req.params.id)
      const tipoId = '1';
      const expectedTipo = {
        id: 1,
        name: 'Espresso',
        description: 'Café espresso puro',
      };
      mockService.remove.mockResolvedValue(expectedTipo);

      // ── ACT: Ejecutar el método del controller ────────────
      // El controller convierte internamente: +'1' → 1 (número)
      // y llama a service.remove(1)
      const result = await controller.remove(tipoId);

      // ── ASSERT: Verificar resultados ──────────────────────
      // Verifica que recibió el NÚMERO 1, no el string '1'.
      // Esto valida que la conversión +id del controller funciona.
      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedTipo);
      expect(result.id).toBe(1);
    });
  });
});

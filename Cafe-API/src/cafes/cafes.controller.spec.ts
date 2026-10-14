import { Test, TestingModule } from '@nestjs/testing';
import { CafesController } from './cafes.controller';
import { CafesService } from './cafes.service';
import { CreateCafeDto } from './dto/create-cafe.dto';

// ══════════════════════════════════════════════════════════════
// TESTS UNITARIOS de CafesController
//
// ¿Cómo funcionan?
// Se basan en el patrón MOCK (simulación). Nunca tocan la base
// de datos ni el servicio real.
//
// 1. Se crea un objeto mockService con funciones vacías (jest.fn())
//    que registran si fueron llamadas y con qué argumentos.
// 2. Se reemplaza el CafesService real por este mock al construir
//    el módulo de prueba (useValue: mockService).
// 3. Se ejecuta el método del controller y se verifica que:
//    - Llamó al servicio con los argumentos correctos
//    - Devolvió el resultado que el servicio le devolvió
//
// Estos tests NO necesitan PostgreSQL porque el servicio está
// reemplazado por un mock. La cadena de dependencias nunca llega
// a TypeORM ni a la base de datos.
// ══════════════════════════════════════════════════════════════
describe('CafesController - Unit Tests', () => {
  let controller: CafesController;
  let service: CafesService;

  // Mock del servicio: funciones vacías que registran sus llamadas.
  // jest.fn() crea una función falsa que no hace nada pero guarda
  // registro de si fue llamada y con qué argumentos.
  const mockService = {
    create: jest.fn(),
    remove: jest.fn(),
  };

  // Se ejecuta antes de CADA test:
  // 1. Crea un módulo de prueba con el controller real y el mock del servicio
  // 2. Cuando NestJS construye CafesController, le inyecta el mock en vez del servicio real
  // 3. jest.clearAllMocks() limpia el registro de llamadas para que cada test empiece limpio
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CafesController],
      providers: [{ provide: CafesService, useValue: mockService }],
    }).compile();

    controller = module.get<CafesController>(CafesController);
    service = module.get<CafesService>(CafesService);
    jest.clearAllMocks();
  });

  describe('POST /cafes - create', () => {
    it('debe crear un café llamando al servicio con el DTO', async () => {
      // ── ARRANGE: Preparar datos y configurar el mock ──────
      // createCafeDto: lo que enviaríamos como petición HTTP
      // Incluye tipoId porque un café necesita estar asociado a un tipo (FK)
      const createCafeDto: CreateCafeDto = {
        name: 'Latte',
        description: 'Café con leche',
        tipoId: 1,
      };
      // expectedCafe: lo que esperamos que el servicio devuelva
      // Nota: tipoId se convierte en relación tipo: { id: 1 }
      const expectedCafe = {
        id: 1,
        name: 'Latte',
        description: 'Café con leche',
        tipo: { id: 1 },
      };
      // Configura el mock para que devuelva expectedCafe como si
      // hubiera creado el registro en la base de datos
      mockService.create.mockResolvedValue(expectedCafe);

      // ── ACT: Ejecutar el método del controller ────────────
      // El controller recibe el DTO y llama a service.create(dto).
      // Pero service es el mock, así que devuelve expectedCafe.
      const result = await controller.create(createCafeDto);

      // ── ASSERT: Verificar resultados ──────────────────────
      // Verifica que el mock FUE llamado con el DTO correcto.
      // Si el controller no llamara al servicio, o lo llamara con
      // otros datos, este expect FALLARÍA.
      expect(service.create).toHaveBeenCalledWith(createCafeDto);
      // Verifica que el resultado devuelto es exactamente el esperado
      expect(result).toEqual(expectedCafe);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Latte');
      // Verifica que la relación con el tipo está correctamente incluida
      expect(result.tipo.id).toBe(1);
    });
  });

  describe('DELETE /cafes/:id - remove', () => {
    it('debe eliminar un café llamando al servicio con el id numérico', async () => {
      // ── ARRANGE: Preparar datos y configurar el mock ──────
      // cafeId es string porque así llega de la URL (req.params.id)
      const cafeId = '1';
      const expectedCafe = {
        id: 1,
        name: 'Latte',
        description: 'Café con leche',
        tipo: { id: 1 },
      };
      mockService.remove.mockResolvedValue(expectedCafe);

      // ── ACT: Ejecutar el método del controller ────────────
      // El controller convierte internamente: +'1' → 1 (número)
      // y llama a service.remove(1)
      const result = await controller.remove(cafeId);

      // ── ASSERT: Verificar resultados ──────────────────────
      // Verifica que recibió el NÚMERO 1, no el string '1'.
      // Esto valida que la conversión +id del controller funciona.
      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedCafe);
      expect(result.id).toBe(1);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// ══════════════════════════════════════════════════════════════
// TESTS E2E (End-to-End) de los endpoints de creación
//
// ¿Cómo funcionan?
// A diferencia de los unit tests, estos prueban la API COMPLETA
// de punta a punta: cliente HTTP → Controller → Service → TypeORM → PostgreSQL
//
// Flujo de cada test:
//   ┌──────────┐   HTTP POST    ┌──────────────┐   SQL INSERT   ┌────────────┐
//   │ supertest │ ────────────→ │ NestJS App   │ ─────────────→ │ PostgreSQL │
//   │ (cliente) │               │ Controller → │                │  tabla     │
//   │           │ ←──────────── │ Service →    │ ←───────────── │  real      │
//   └──────────┘   HTTP 201     │ TypeORM      │   RETURNING    └────────────┘
//                               └──────────────┘
//
// ¿Usan PostgreSQL?
// SÍ. Importan el AppModule completo, que incluye TypeOrmModule
// que se conecta a localhost:5432 (el Docker de PostgreSQL).
// Los datos se INSERTAN de verdad en las tablas y se limpian
// con TRUNCATE antes de cada ejecución.
//
// ¿Qué necesitan?
// - PostgreSQL levantado: docker-compose up -d postgres
// - Comando: npm run test:e2e
// ══════════════════════════════════════════════════════════════
describe('Create tests (e2e)', () => {
  let app: INestApplication;

  // ── beforeAll: Configuración inicial (se ejecuta UNA vez) ──
  // 1. Importa el AppModule REAL (incluye TypeORM + conexión a PostgreSQL)
  // 2. Crea la app con el mismo ValidationPipe que usa main.ts en producción
  // 3. Conecta a la base de datos y limpia las tablas
  beforeAll(async () => {
    // Crea el módulo de prueba importando el AppModule completo.
    // AppModule incluye TypeOrmModule.forRootAsync que conecta
    // a PostgreSQL en localhost:5432 con las tablas Tipo y Cafe.
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Aplica el MISMO ValidationPipe que usa main.ts en producción.
    // Esto asegura que las validaciones de DTO funcionen igual
    // en los tests que en el entorno real.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,          // Ignora propiedades no definidas en el DTO
        forbidNonWhitelisted: true, // Lanza error 400 si hay propiedades extra
        transform: true,          // Convierte tipos automáticamente
        transformOptions: {
          enableImplicitConversion: true, // Convierte string a number, etc.
        },
      }),
    );

    // Inicia la app: conecta a PostgreSQL y sincroniza las tablas
    // (synchronize: true crea/modifica columnas según las entidades)
    await app.init();

    // Limpia la base de datos para que cada ejecución empiece desde cero:
    // - TRUNCATE: borra TODOS los datos de las tablas
    // - RESTART IDENTITY: reinicia los IDs (el siguiente será 1)
    // - CASCADE: primero borra cafes (por la foreign key), luego tipos
    const dataSource = app.get(getDataSourceToken());
    await dataSource.query('TRUNCATE cafe, tipo RESTART IDENTITY CASCADE');
  });

  // ── afterAll: Limpieza final (se ejecuta UNA vez al terminar) ──
  // Cierra la app y la conexión a la base de datos
  afterAll(async () => {
    await app.close();
  });

  // ── Test 1: Crear un tipo ─────────────────────────────────
  describe('POST /tipos - crear un tipo', () => {
    it('debe crear un tipo con datos válidos', async () => {
      // ── ARRANGE: Datos del test ───────────────────────────
      const tipoData = {
        name: 'Espresso',
        description: 'Café espresso puro',
      };

      // ── ACT: Ejecutar la petición HTTP ────────────────────
      // supertest simula un cliente HTTP real:
      // - .post('/tipos') envía una petición POST al endpoint
      // - .send(tipoData) adjunta el cuerpo JSON
      // - .expect(201) espera que el servidor responda 201 (Created)
      //
      // Flujo interno que ocurre:
      // 1. NestJS recibe la petición en TiposController.create()
      // 2. El ValidationPipe valida el DTO (name >= 3 caracteres)
      // 3. TiposService.create() llama a TypeORM
      // 4. TypeORM ejecuta: INSERT INTO "tipo" ("name", "description") VALUES ($1, $2)
      // 5. PostgreSQL guarda el registro y devuelve el id generado
      // 6. NestJS responde 201 con el JSON del tipo creado
      const response = await request(app.getHttpServer())
        .post('/tipos')
        .send(tipoData)
        .expect(201);

      // ── ASSERT: Verificar la respuesta ────────────────────
      // Verifica que la DB asignó un id (se generó en PostgreSQL)
      expect(response.body).toHaveProperty('id');
      // Verifica que el nombre se persistió correctamente
      expect(response.body.name).toBe(tipoData.name);
      // Verifica que la descripción se persistió correctamente
      expect(response.body.description).toBe(tipoData.description);
    });
  });

  // ── Test 2: Crear un café ─────────────────────────────────
  describe('POST /cafes - crear un café', () => {
    let tipoId: number;

    // beforeAll anidado: se ejecuta antes de los tests de ESTE describe.
    // Crea un tipo primero porque cafe.tipoId es FOREIGN KEY:
    // no se puede crear un café sin un tipo que exista en la tabla "tipo".
    beforeAll(async () => {
      const tipoResponse = await request(app.getHttpServer())
        .post('/tipos')
        .send({ name: 'Granos', description: 'Tipos de granos de café' })
        .expect(201);

      // Guarda el id que PostgreSQL le asignó al tipo
      tipoId = tipoResponse.body.id;
    });

    it('debe crear un café con tipoId válido', async () => {
      // ── ARRANGE: Datos del test ───────────────────────────
      const cafeData = {
        name: 'Latte',
        description: 'Café con leche',
        tipoId: tipoId, // Usa el id del tipo creado en el beforeAll
      };

      // ── ACT: Ejecutar la petición HTTP ────────────────────
      // Flujo interno:
      // 1. ValidationPipe valida el DTO (name >= 3, tipoId es entero positivo)
      // 2. CafesService.create() convierte tipoId → { tipo: { id: tipoId } }
      // 3. TypeORM ejecuta: INSERT INTO "cafe" ("name", "description", "tipoId")
      //    VALUES ($1, $2, $3)
      // 4. PostgreSQL verifica la FOREIGN KEY (tipoId existe en tabla "tipo")
      // 5. Responde 201 con el café creado y su relación tipo
      const response = await request(app.getHttpServer())
        .post('/cafes')
        .send(cafeData)
        .expect(201);

      // ── ASSERT: Verificar la respuesta ────────────────────
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(cafeData.name);
      expect(response.body.description).toBe(cafeData.description);
      // Verifica que la RELACIÓN con el tipo se guardó correctamente:
      // el café quedó asociado al tipo correcto en la base de datos
      expect(response.body.tipo).toHaveProperty('id', tipoId);
    });
  });
});

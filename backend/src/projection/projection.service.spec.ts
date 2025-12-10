import { Test, TestingModule } from '@nestjs/testing';
import { ProjectionService } from './projection.service';
import { ExternalApiService } from '../external/external-api.service';
import {
  MallaItem,
  AvanceItem,
  ProyeccionResponse,
} from './types';

describe('ProjectionService', () => {
  let service: ProjectionService;
  let externalApiService: jest.Mocked<ExternalApiService>;

  const mockExternalApiService = {
    getMalla: jest.fn(),
    getAvance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectionService,
        {
          provide: ExternalApiService,
          useValue: mockExternalApiService,
        },
      ],
    }).compile();

    service = module.get<ProjectionService>(ProjectionService);
    externalApiService = module.get(ExternalApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildProjection', () => {
    const rut = '12345678-9';
    const codCarrera = 'ECIN';
    const catalogo = '2023';

    const mockMalla: MallaItem[] = [
      {
        codigo: 'ECIN-00123',
        asignatura: 'Programación',
        creditos: 5,
        nivel: 1,
        prereq: undefined,
      },
      {
        codigo: 'ECIN-00456',
        asignatura: 'Base de Datos',
        creditos: 5,
        nivel: 2,
        prereq: 'ECIN-00123',
      },
      {
        codigo: 'ECIN-00789',
        asignatura: 'Algoritmos',
        creditos: 5,
        nivel: 1,
        prereq: undefined,
      },
    ];

    const mockAvance: AvanceItem[] = [
      {
        nrc: '12345',
        period: '202310',
        student: rut,
        course: 'ECIN-00123',
        excluded: false,
        inscriptionType: 'NORMAL',
        status: 'APROBADO',
      },
    ];

    it('should successfully build projection with approved courses', async () => {
      externalApiService.getMalla.mockResolvedValue(mockMalla);
      externalApiService.getAvance.mockResolvedValue(mockAvance);

      const result: ProyeccionResponse = await service.buildProjection({
        rut,
        codCarrera,
        catalogo,
      });

      expect(result).toHaveProperty('resumen');
      expect(result).toHaveProperty('semestres');
      expect(result).toHaveProperty('pendientes');

      expect(result.semestres).toHaveLength(1);
      expect(result.semestres[0].periodo).toBe('2023-1');
      expect(result.semestres[0].ramos).toHaveLength(1);
      expect(result.semestres[0].ramos[0].codigo).toBe('ECIN-00123');
      expect(result.semestres[0].ramos[0].estado).toBe('APROBADO');

      expect(result.pendientes).toHaveLength(2);
      expect(result.pendientes[0].nivel).toBe(1);
      expect(result.pendientes[1].nivel).toBe(2);
    });

    it('should calculate progress correctly', async () => {
      externalApiService.getMalla.mockResolvedValue(mockMalla);
      externalApiService.getAvance.mockResolvedValue(mockAvance);

      const result = await service.buildProjection({
        rut,
        codCarrera,
        catalogo,
      });

      expect(result.resumen.creditosTotales).toBe(15);
      expect(result.resumen.creditosAprobados).toBe(5);
      expect(result.resumen.porcentaje).toBeCloseTo(33.3, 1);
    });

    it('should handle courses with prerequisites', async () => {
      const mallaWithPrereq: MallaItem[] = [
        {
          codigo: 'ECIN-00123',
          asignatura: 'Programación',
          creditos: 5,
          nivel: 1,
          prereq: undefined,
        },
        {
          codigo: 'ECIN-00456',
          asignatura: 'Base de Datos',
          creditos: 5,
          nivel: 2,
          prereq: 'ECIN-00123',
        },
      ];

      const avanceWithPrereq: AvanceItem[] = [
        {
          nrc: '12345',
          period: '202310',
          student: rut,
          course: 'ECIN-00123',
          excluded: false,
          inscriptionType: 'NORMAL',
          status: 'APROBADO',
        },
      ];

      externalApiService.getMalla.mockResolvedValue(mallaWithPrereq);
      externalApiService.getAvance.mockResolvedValue(avanceWithPrereq);

      const result = await service.buildProjection({
        rut,
        codCarrera,
        catalogo,
      });

      const pendienteDb = result.pendientes.find((p) => p.nivel === 2);
      expect(pendienteDb).toBeDefined();
      expect(pendienteDb?.ramos[0].prerequisitos).toContain('ECIN-00123');
    });

    it('should sort semesters by period', async () => {
      const avanceMultiplePeriods: AvanceItem[] = [
        {
          nrc: '12345',
          period: '202320',
          student: rut,
          course: 'ECIN-00456',
          excluded: false,
          inscriptionType: 'NORMAL',
          status: 'APROBADO',
        },
        {
          nrc: '67890',
          period: '202310',
          student: rut,
          course: 'ECIN-00123',
          excluded: false,
          inscriptionType: 'NORMAL',
          status: 'APROBADO',
        },
      ];

      externalApiService.getMalla.mockResolvedValue(mockMalla);
      externalApiService.getAvance.mockResolvedValue(avanceMultiplePeriods);

      const result = await service.buildProjection({
        rut,
        codCarrera,
        catalogo,
      });

      expect(result.semestres).toHaveLength(2);
      expect(result.semestres[0].periodo).toBe('2023-1');
      expect(result.semestres[1].periodo).toBe('2023-2');
    });

    it('should handle empty avance', async () => {
      externalApiService.getMalla.mockResolvedValue(mockMalla);
      externalApiService.getAvance.mockResolvedValue([]);

      const result = await service.buildProjection({
        rut,
        codCarrera,
        catalogo,
      });

      expect(result.semestres).toHaveLength(0);
      expect(result.pendientes.length).toBeGreaterThan(0);
      expect(result.resumen.creditosAprobados).toBe(0);
      expect(result.resumen.porcentaje).toBe(0);
    });

    it('should handle courses not in malla', async () => {
      const avanceWithUnknown: AvanceItem[] = [
        {
          nrc: '12345',
          period: '202310',
          student: rut,
          course: 'ECIN-99999',
          excluded: false,
          inscriptionType: 'NORMAL',
          status: 'APROBADO',
        },
      ];

      externalApiService.getMalla.mockResolvedValue(mockMalla);
      externalApiService.getAvance.mockResolvedValue(avanceWithUnknown);

      const result = await service.buildProjection({
        rut,
        codCarrera,
        catalogo,
      });

      expect(result.semestres).toHaveLength(0);
    });

    it('should parse period correctly (10 -> 1, 20 -> 2)', async () => {
      const avanceWithPeriod10: AvanceItem[] = [
        {
          nrc: '12345',
          period: '202310',
          student: rut,
          course: 'ECIN-00123',
          excluded: false,
          inscriptionType: 'NORMAL',
          status: 'APROBADO',
        },
        {
          nrc: '67890',
          period: '202320',
          student: rut,
          course: 'ECIN-00456',
          excluded: false,
          inscriptionType: 'NORMAL',
          status: 'APROBADO',
        },
      ];

      externalApiService.getMalla.mockResolvedValue(mockMalla);
      externalApiService.getAvance.mockResolvedValue(avanceWithPeriod10);

      const result = await service.buildProjection({
        rut,
        codCarrera,
        catalogo,
      });

      expect(result.semestres[0].periodo).toBe('2023-1');
      expect(result.semestres[1].periodo).toBe('2023-2');
    });
  });
});


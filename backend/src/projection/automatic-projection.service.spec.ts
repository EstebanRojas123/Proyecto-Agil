import { Test, TestingModule } from '@nestjs/testing';
import { AutomaticProjectionService } from './automatic-projection.service';
import { ProjectionService } from './projection.service';
import { RawProjectionResponse } from './types';

describe('AutomaticProjectionService', () => {
  let service: AutomaticProjectionService;
  let projectionService: jest.Mocked<ProjectionService>;

  const mockProjectionService = {
    buildProjection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomaticProjectionService,
        {
          provide: ProjectionService,
          useValue: mockProjectionService,
        },
      ],
    }).compile();

    service = module.get<AutomaticProjectionService>(AutomaticProjectionService);
    projectionService = module.get(ProjectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildAutomaticProjection', () => {
    const rut = '12345678-9';
    const codCarrera = 'ECIN';
    const catalogo = '2023';

    const mockBaseProjection: RawProjectionResponse = {
      resumen: {
        creditosTotales: 300,
        creditosAprobados: 100,
        porcentaje: 33.3,
      },
      semestres: [
        {
          periodo: '2023-1',
          ramos: [
            {
              codigo: 'ECIN-00123',
              nombre: 'Programación',
              estado: 'APROBADO',
              creditos: 5,
              nivel: 1,
              prerequisitos: [],
            },
          ],
        },
      ],
      pendientes: [
        {
          nivel: 1,
          ramos: [
            {
              codigo: 'ECIN-00234',
              nombre: 'Matemáticas',
              estado: 'PENDIENTE',
              creditos: 5,
              nivel: 1,
              prerequisitos: [],
            },
          ],
        },
        {
          nivel: 2,
          ramos: [
            {
              codigo: 'ECIN-00345',
              nombre: 'Algoritmos',
              estado: 'PENDIENTE',
              creditos: 5,
              nivel: 2,
              prerequisitos: ['ECIN-00123'],
            },
          ],
        },
      ],
    };

    it('should successfully build automatic projection', async () => {
      projectionService.buildProjection.mockResolvedValue(mockBaseProjection);

      const result = await service.buildAutomaticProjection({
        rut,
        codCarrera,
        catalogo,
      });

      expect(result).toHaveProperty('resumen');
      expect(result).toHaveProperty('semestres');
      expect(result).toHaveProperty('pendientes');
      expect(result.pendientes).toEqual([]);
      expect(result.semestres.length).toBeGreaterThan(0);
      expect(projectionService.buildProjection).toHaveBeenCalledWith({
        rut,
        codCarrera,
        catalogo,
      });
    });

    it('should prioritize capstone project when prerequisites are met', async () => {
      const projectionWithCapstone: RawProjectionResponse = {
        resumen: {
          creditosTotales: 300,
          creditosAprobados: 250,
          porcentaje: 83.3,
        },
        semestres: [],
        pendientes: [
          {
            nivel: 10,
            ramos: [
              {
                codigo: 'ECIN-01000',
                nombre: 'Capstone Project',
                estado: 'PENDIENTE',
                creditos: 10,
                nivel: 10,
                prerequisitos: ['ECIN-00123', 'ECIN-00234'],
              },
            ],
          },
        ],
      };

      const normalizedBase = {
        semestres: [],
        aprobadosSet: new Set(['ECIN-00123', 'ECIN-00234']),
        inscritosSet: new Set(),
        reprobadosSet: new Set(),
        nivelBase: 9,
      };

      projectionService.buildProjection.mockResolvedValue(projectionWithCapstone);

      const result = await service.buildAutomaticProjection({
        rut,
        codCarrera,
        catalogo,
      });

      expect(result.semestres.length).toBeGreaterThan(0);
      const capstoneSemester = result.semestres.find((s) =>
        s.ramos.some((r) => r.codigo === 'ECIN-01000'),
      );
      expect(capstoneSemester).toBeDefined();
    });

    it('should respect credit limit per semester', async () => {
      const projectionWithManyCourses: RawProjectionResponse = {
        resumen: {
          creditosTotales: 300,
          creditosAprobados: 0,
          porcentaje: 0,
        },
        semestres: [],
        pendientes: [
          {
            nivel: 1,
            ramos: Array.from({ length: 20 }, (_, i) => ({
              codigo: `ECIN-00${i.toString().padStart(3, '0')}`,
              nombre: `Curso ${i}`,
              estado: 'PENDIENTE',
              creditos: 5,
              nivel: 1,
              prerequisitos: [],
            })),
          },
        ],
      };

      projectionService.buildProjection.mockResolvedValue(projectionWithManyCourses);

      const result = await service.buildAutomaticProjection({
        rut,
        codCarrera,
        catalogo,
      });

      result.semestres.forEach((semestre) => {
        const totalCredits = semestre.ramos.reduce(
          (sum, ramo) => sum + ramo.creditos,
          0,
        );
        expect(totalCredits).toBeLessThanOrEqual(30);
      });
    });

    it('should handle empty pendientes', async () => {
      const projectionEmpty: RawProjectionResponse = {
        resumen: {
          creditosTotales: 300,
          creditosAprobados: 300,
          porcentaje: 100,
        },
        semestres: [],
        pendientes: [],
      };

      projectionService.buildProjection.mockResolvedValue(projectionEmpty);

      const result = await service.buildAutomaticProjection({
        rut,
        codCarrera,
        catalogo,
      });

      expect(result.semestres).toHaveLength(0);
      expect(result.pendientes).toEqual([]);
    });

    it('should respect prerequisites when building projection', async () => {
      const projectionWithPrereq: RawProjectionResponse = {
        resumen: {
          creditosTotales: 300,
          creditosAprobados: 5,
          porcentaje: 1.7,
        },
        semestres: [
          {
            periodo: '2023-1',
            ramos: [
              {
                codigo: 'ECIN-00123',
                nombre: 'Programación',
                estado: 'APROBADO',
                creditos: 5,
                nivel: 1,
                prerequisitos: [],
              },
            ],
          },
        ],
        pendientes: [
          {
            nivel: 2,
            ramos: [
              {
                codigo: 'ECIN-00345',
                nombre: 'Algoritmos',
                estado: 'PENDIENTE',
                creditos: 5,
                nivel: 2,
                prerequisitos: ['ECIN-00123'],
              },
            ],
          },
        ],
      };

      projectionService.buildProjection.mockResolvedValue(projectionWithPrereq);

      const result = await service.buildAutomaticProjection({
        rut,
        codCarrera,
        catalogo,
      });

      const algoritmosSemester = result.semestres.find((s) =>
        s.ramos.some((r) => r.codigo === 'ECIN-00345'),
      );
      expect(algoritmosSemester).toBeDefined();

      const programacionSemester = result.semestres.find((s) =>
        s.ramos.some((r) => r.codigo === 'ECIN-00123'),
      );
      if (programacionSemester && algoritmosSemester) {
        const programacionIndex = result.semestres.indexOf(programacionSemester);
        const algoritmosIndex = result.semestres.indexOf(algoritmosSemester);
        expect(algoritmosIndex).toBeGreaterThan(programacionIndex);
      }
    });
  });
});


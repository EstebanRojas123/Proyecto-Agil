import { Test, TestingModule } from '@nestjs/testing';
import { ProjectionController } from './projection.controller';
import { ProjectionService } from './projection.service';
import { AutomaticProjectionService } from './automatic-projection.service';
import { ProyeccionResponse } from './types';

describe('ProjectionController', () => {
  let controller: ProjectionController;
  let projectionService: jest.Mocked<ProjectionService>;
  let automaticProjectionService: jest.Mocked<AutomaticProjectionService>;

  const mockProjectionService = {
    buildProjection: jest.fn(),
  };

  const mockAutomaticProjectionService = {
    buildAutomaticProjection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectionController],
      providers: [
        {
          provide: ProjectionService,
          useValue: mockProjectionService,
        },
        {
          provide: AutomaticProjectionService,
          useValue: mockAutomaticProjectionService,
        },
      ],
    }).compile();

    controller = module.get<ProjectionController>(ProjectionController);
    projectionService = module.get(ProjectionService);
    automaticProjectionService = module.get(AutomaticProjectionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProjection', () => {
    const rut = '12345678-9';
    const codcarrera = 'ECIN';
    const catalogo = '2023';
    const mockProjection: ProyeccionResponse = {
      resumen: {
        creditosTotales: 300,
        creditosAprobados: 100,
        porcentaje: 33.3,
      },
      semestres: [],
      pendientes: [],
    };

    it('should successfully get projection', async () => {
      projectionService.buildProjection.mockResolvedValue(mockProjection);

      const result = await controller.getProjection(rut, codcarrera, catalogo);

      expect(result).toEqual(mockProjection);
      expect(projectionService.buildProjection).toHaveBeenCalledWith({
        rut,
        codCarrera: codcarrera,
        catalogo,
      });
    });

    it('should throw error when rut is missing', async () => {
      await expect(
        controller.getProjection('', codcarrera, catalogo),
      ).rejects.toThrow('Faltan parámetros: rut, codcarrera, catalogo');
    });

    it('should throw error when codcarrera is missing', async () => {
      await expect(
        controller.getProjection(rut, '', catalogo),
      ).rejects.toThrow('Faltan parámetros: rut, codcarrera, catalogo');
    });

    it('should throw error when catalogo is missing', async () => {
      await expect(
        controller.getProjection(rut, codcarrera, ''),
      ).rejects.toThrow('Faltan parámetros: rut, codcarrera, catalogo');
    });
  });

  describe('getAutomaticProjection', () => {
    const rut = '12345678-9';
    const codcarrera = 'ECIN';
    const catalogo = '2023';
    const mockAutomaticProjection: ProyeccionResponse = {
      resumen: {
        creditosTotales: 300,
        creditosAprobados: 100,
        porcentaje: 33.3,
      },
      semestres: [
        {
          periodo: '2024-1',
          ramos: [
            {
              codigo: 'ECIN-00123',
              nombre: 'Programación',
              estado: 'PROYECTADO',
              creditos: 5,
              nivel: 1,
              prerequisitos: [],
            },
          ],
        },
      ],
      pendientes: [],
    };

    it('should successfully get automatic projection', async () => {
      automaticProjectionService.buildAutomaticProjection.mockResolvedValue(
        mockAutomaticProjection,
      );

      const result = await controller.getAutomaticProjection(
        rut,
        codcarrera,
        catalogo,
      );

      expect(result).toEqual(mockAutomaticProjection);
      expect(
        automaticProjectionService.buildAutomaticProjection,
      ).toHaveBeenCalledWith({
        rut,
        codCarrera: codcarrera,
        catalogo,
      });
    });

    it('should throw error when rut is missing', async () => {
      await expect(
        controller.getAutomaticProjection('', codcarrera, catalogo),
      ).rejects.toThrow('Faltan parámetros: rut, codcarrera, catalogo');
    });

    it('should throw error when codcarrera is missing', async () => {
      await expect(
        controller.getAutomaticProjection(rut, '', catalogo),
      ).rejects.toThrow('Faltan parámetros: rut, codcarrera, catalogo');
    });

    it('should throw error when catalogo is missing', async () => {
      await expect(
        controller.getAutomaticProjection(rut, codcarrera, ''),
      ).rejects.toThrow('Faltan parámetros: rut, codcarrera, catalogo');
    });
  });
});


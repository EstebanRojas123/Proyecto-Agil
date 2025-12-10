import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ManualProjectionController } from './manual-projection.controller';
import { ManualProjectionService } from './manual-projection.service';
import { CreateManualProjectionDto } from './dtos/create-manual-projection.dto';
import { ManualProjection } from './entities/manual-projection.entity';
import { User } from './entities/user.entity';

describe('ManualProjectionController', () => {
  let controller: ManualProjectionController;
  let manualProjectionService: jest.Mocked<ManualProjectionService>;

  const mockManualProjectionService = {
    createFromManualJson: jest.fn(),
    findByUser: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManualProjectionController],
      providers: [
        {
          provide: ManualProjectionService,
          useValue: mockManualProjectionService,
        },
      ],
    }).compile();

    controller = module.get<ManualProjectionController>(
      ManualProjectionController,
    );
    manualProjectionService = module.get(ManualProjectionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const mockDto: CreateManualProjectionDto = {
      Carrera: 'ECIN',
      estudiante: '12345678-9',
      proyeccionActivaId: 'proj-123',
      semestresProyectados: [
        {
          id: 'sem-1',
          periodo: '2024-1',
          cursos: [
            {
              codigo: 'ECIN-00123',
              asignatura: 'Programación',
              creditos: 5,
              nivel: 1,
            },
          ],
        },
      ],
    };

    const mockProjection: ManualProjection = {
      id: 'proj-123',
      Carrera: 'ECIN',
      user: { id: 1, rut: '12345678-9' } as User,
      semestres: [],
    } as ManualProjection;

    it('should successfully create projection', async () => {
      manualProjectionService.createFromManualJson.mockResolvedValue(
        mockProjection,
      );

      const result = await controller.create(mockDto);

      expect(result).toEqual(mockProjection);
      expect(manualProjectionService.createFromManualJson).toHaveBeenCalledWith(
        mockDto,
      );
    });

    it('should handle empty dto', async () => {
      const emptyDto: CreateManualProjectionDto = {
        Carrera: '',
        estudiante: '',
        proyeccionActivaId: '',
        semestresProyectados: [],
      };

      manualProjectionService.createFromManualJson.mockResolvedValue(
        mockProjection,
      );

      const result = await controller.create(emptyDto);

      expect(result).toBeDefined();
    });
  });

  describe('findByUser', () => {
    const rut = '12345678-9';
    const mockProjections: ManualProjection[] = [
      {
        id: 'proj-1',
        Carrera: 'ECIN',
        user: { id: 1, rut } as User,
        semestres: [],
      } as ManualProjection,
    ];

    it('should successfully find projections by user', async () => {
      manualProjectionService.findByUser.mockResolvedValue(mockProjections);

      const result = await controller.findByUser(rut);

      expect(result).toEqual(mockProjections);
      expect(manualProjectionService.findByUser).toHaveBeenCalledWith(rut);
    });

    it('should return empty array when user has no projections', async () => {
      manualProjectionService.findByUser.mockResolvedValue([]);

      const result = await controller.findByUser(rut);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const id = 'proj-123';
    const mockProjection: ManualProjection = {
      id,
      Carrera: 'ECIN',
      user: { id: 1, rut: '12345678-9' } as User,
      semestres: [],
    } as ManualProjection;

    it('should successfully find projection by id', async () => {
      manualProjectionService.findOne.mockResolvedValue(mockProjection);

      const result = await controller.findOne(id);

      expect(result).toEqual(mockProjection);
      expect(manualProjectionService.findOne).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when projection not found', async () => {
      manualProjectionService.findOne.mockRejectedValue(
        new NotFoundException(`Proyección ${id} no encontrada`),
      );

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const id = 'proj-123';

    it('should successfully remove projection', async () => {
      manualProjectionService.remove.mockResolvedValue(undefined);

      await controller.remove(id);

      expect(manualProjectionService.remove).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when projection not found', async () => {
      manualProjectionService.remove.mockRejectedValue(
        new NotFoundException(`Proyección ${id} no encontrada`),
      );

      await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
    });
  });
});


import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ManualProjectionService } from './manual-projection.service';
import { User } from './entities/user.entity';
import { ManualProjection } from './entities/manual-projection.entity';
import { ProjectedSemester } from './entities/projected-semester.entity';
import { ProjectedCourse } from './entities/projected-course.entity';
import {
  CreateManualProjectionDto,
  CreateProjectedSemesterDto,
  CreateProjectedCourseDto,
} from './dtos/create-manual-projection.dto';

describe('ManualProjectionService', () => {
  let service: ManualProjectionService;
  let userRepo: jest.Mocked<Repository<User>>;
  let projectionRepo: jest.Mocked<Repository<ManualProjection>>;
  let semesterRepo: jest.Mocked<Repository<ProjectedSemester>>;
  let courseRepo: jest.Mocked<Repository<ProjectedCourse>>;
  let dataSource: jest.Mocked<DataSource>;
  let entityManager: jest.Mocked<EntityManager>;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockProjectionRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
  };

  const mockSemesterRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockCourseRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockEntityManager = {
    getRepository: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManualProjectionService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(ManualProjection),
          useValue: mockProjectionRepo,
        },
        {
          provide: getRepositoryToken(ProjectedSemester),
          useValue: mockSemesterRepo,
        },
        {
          provide: getRepositoryToken(ProjectedCourse),
          useValue: mockCourseRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ManualProjectionService>(ManualProjectionService);
    userRepo = module.get(getRepositoryToken(User));
    projectionRepo = module.get(getRepositoryToken(ManualProjection));
    semesterRepo = module.get(getRepositoryToken(ProjectedSemester));
    courseRepo = module.get(getRepositoryToken(ProjectedCourse));
    dataSource = module.get(DataSource);

    entityManager = mockEntityManager as any;
    mockDataSource.transaction.mockImplementation(async (callback) => {
      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === User) return mockUserRepo;
        if (entity === ManualProjection) return mockProjectionRepo;
        return null;
      });
      return callback(entityManager);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFromManualJson', () => {
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
              prereq: undefined,
            },
          ],
        },
      ],
    };

    it('should create projection with new user', async () => {
      const mockUser = { id: 1, rut: '12345678-9' } as User;
      const mockProjection = {
        id: 'proj-123',
        Carrera: 'ECIN',
        user: mockUser,
        semestres: [],
      } as ManualProjection;

      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue(mockUser);
      mockUserRepo.save.mockResolvedValue(mockUser);
      mockProjectionRepo.save.mockResolvedValue(mockProjection);

      const result = await service.createFromManualJson(mockDto);

      expect(result).toBeDefined();
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { rut: mockDto.estudiante },
      });
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        rut: mockDto.estudiante,
      });
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mockProjectionRepo.save).toHaveBeenCalled();
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should create projection with existing user', async () => {
      const mockUser = { id: 1, rut: '12345678-9' } as User;
      const mockProjection = {
        id: 'proj-123',
        Carrera: 'ECIN',
        user: mockUser,
        semestres: [],
      } as ManualProjection;

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockProjectionRepo.save.mockResolvedValue(mockProjection);

      const result = await service.createFromManualJson(mockDto);

      expect(result).toBeDefined();
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { rut: mockDto.estudiante },
      });
      expect(mockUserRepo.create).not.toHaveBeenCalled();
      expect(mockProjectionRepo.save).toHaveBeenCalled();
    });

    it('should create projection with multiple semesters and courses', async () => {
      const mockDtoMultiple: CreateManualProjectionDto = {
        ...mockDto,
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
          {
            id: 'sem-2',
            periodo: '2024-2',
            cursos: [
              {
                codigo: 'ECIN-00456',
                asignatura: 'Base de Datos',
                creditos: 5,
                nivel: 2,
                prereq: 'ECIN-00123',
              },
            ],
          },
        ],
      };

      const mockUser = { id: 1, rut: '12345678-9' } as User;
      const mockProjection = {
        id: 'proj-123',
        Carrera: 'ECIN',
        user: mockUser,
        semestres: [],
      } as ManualProjection;

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockProjectionRepo.save.mockResolvedValue(mockProjection);

      const result = await service.createFromManualJson(mockDtoMultiple);

      expect(result).toBeDefined();
      expect(mockProjectionRepo.save).toHaveBeenCalled();
      const savedProjection = mockProjectionRepo.save.mock.calls[0][0];
      expect(savedProjection.semestres).toHaveLength(2);
      expect(savedProjection.semestres[0].orden).toBe(1);
      expect(savedProjection.semestres[1].orden).toBe(2);
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
      {
        id: 'proj-2',
        Carrera: 'ECIN',
        user: { id: 1, rut } as User,
        semestres: [],
      } as ManualProjection,
    ];

    it('should find projections by user RUT', async () => {
      mockProjectionRepo.find.mockResolvedValue(mockProjections);

      const result = await service.findByUser(rut);

      expect(result).toEqual(mockProjections);
      expect(mockProjectionRepo.find).toHaveBeenCalledWith({
        where: { user: { rut } },
        relations: ['semestres', 'semestres.cursos', 'user'],
        order: { semestres: { orden: 'ASC' } },
      });
    });

    it('should return empty array when user has no projections', async () => {
      mockProjectionRepo.find.mockResolvedValue([]);

      const result = await service.findByUser(rut);

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

    it('should find projection by id', async () => {
      mockProjectionRepo.findOne.mockResolvedValue(mockProjection);

      const result = await service.findOne(id);

      expect(result).toEqual(mockProjection);
      expect(mockProjectionRepo.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['semestres', 'semestres.cursos', 'user'],
        order: { semestres: { orden: 'ASC' } },
      });
    });

    it('should throw NotFoundException when projection not found', async () => {
      mockProjectionRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(id)).rejects.toThrow(
        `Proyección ${id} no encontrada`,
      );
    });
  });

  describe('remove', () => {
    const id = 'proj-123';

    it('should successfully remove projection', async () => {
      mockProjectionRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove(id);

      expect(mockProjectionRepo.delete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when projection not found', async () => {
      mockProjectionRepo.delete.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      await expect(service.remove(id)).rejects.toThrow(
        `Proyección ${id} no encontrada`,
      );
    });
  });
});


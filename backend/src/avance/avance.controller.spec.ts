import { Test, TestingModule } from '@nestjs/testing';
import { AvanceController } from './avance.controller';
import { AvanceService } from './avance.service';

describe('AvanceController', () => {
  let controller: AvanceController;
  let avanceService: jest.Mocked<AvanceService>;

  const mockAvanceService = {
    getAvanceConNombre: jest.fn(),
    getMalla: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvanceController],
      providers: [
        {
          provide: AvanceService,
          useValue: mockAvanceService,
        },
      ],
    }).compile();

    controller = module.get<AvanceController>(AvanceController);
    avanceService = module.get(AvanceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAvance', () => {
    const rut = '12345678-9';
    const codCarrera = 'ECIN';
    const catalogo = '2023';
    const mockResult = [
      {
        course: 'ECIN-00123',
        nombre: 'Programación',
        status: 'APROBADO',
        period: '202310',
        nrc: '12345',
      },
    ];

    it('should successfully get avance', async () => {
      avanceService.getAvanceConNombre.mockResolvedValue(mockResult);

      const result = await controller.getAvance(rut, codCarrera, catalogo);

      expect(result).toEqual(mockResult);
      expect(avanceService.getAvanceConNombre).toHaveBeenCalledWith(
        rut,
        codCarrera,
        catalogo,
      );
    });

    it('should handle empty parameters', async () => {
      avanceService.getAvanceConNombre.mockResolvedValue([]);

      const result = await controller.getAvance('', '', '');

      expect(result).toEqual([]);
      expect(avanceService.getAvanceConNombre).toHaveBeenCalledWith('', '', '');
    });
  });

  describe('getMalla', () => {
    const codCarrera = 'ECIN';
    const catalogo = '2023';
    const mockMalla = [
      {
        codigo: 'ECIN-00123',
        asignatura: 'Programación',
        creditos: 5,
        nivel: 1,
      },
    ];

    it('should successfully get malla', async () => {
      avanceService.getMalla.mockResolvedValue(mockMalla);

      const result = await controller.getMalla(codCarrera, catalogo);

      expect(result).toEqual(mockMalla);
      expect(avanceService.getMalla).toHaveBeenCalledWith(codCarrera, catalogo);
    });

    it('should handle empty malla', async () => {
      avanceService.getMalla.mockResolvedValue([]);

      const result = await controller.getMalla('', '');

      expect(result).toEqual([]);
    });
  });
});


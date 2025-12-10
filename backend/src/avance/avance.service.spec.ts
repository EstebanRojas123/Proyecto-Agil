import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { AvanceService } from './avance.service';

describe('AvanceService', () => {
  let service: AvanceService;
  let httpService: jest.Mocked<HttpService>;

  const mockHttpService = {
    axiosRef: {
      get: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvanceService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<AvanceService>(AvanceService);
    httpService = module.get(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvance', () => {
    const rut = '12345678-9';
    const codCarrera = 'ECIN';
    const mockAvanceData = [
      {
        course: 'ECIN-00123',
        status: 'APROBADO',
        period: '202310',
        nrc: '12345',
      },
    ];

    it('should successfully get avance data', async () => {
      httpService.axiosRef.get.mockResolvedValue({ data: mockAvanceData });

      const result = await service.getAvance(rut, codCarrera);

      expect(result).toEqual(mockAvanceData);
      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        expect.stringContaining(`rut=${rut}`),
      );
      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        expect.stringContaining(`codcarrera=${codCarrera}`),
      );
    });

    it('should handle empty avance data', async () => {
      httpService.axiosRef.get.mockResolvedValue({ data: [] });

      const result = await service.getAvance(rut, codCarrera);

      expect(result).toEqual([]);
    });
  });

  describe('getMalla', () => {
    const codCarrera = 'ECIN';
    const catalogo = '2023';
    const mockMallaData = [
      {
        codigo: 'ECIN-00123',
        asignatura: 'Programación',
        creditos: 5,
        nivel: 1,
      },
    ];

    it('should successfully get malla data', async () => {
      httpService.axiosRef.get.mockResolvedValue({ data: mockMallaData });

      const result = await service.getMalla(codCarrera, catalogo);

      expect(result).toEqual(mockMallaData);
      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        expect.stringContaining(`${codCarrera}-${catalogo}`),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-HAWAII-AUTH': 'jf400fejof13f',
          }),
        }),
      );
    });

    it('should handle empty malla data', async () => {
      httpService.axiosRef.get.mockResolvedValue({ data: [] });

      const result = await service.getMalla(codCarrera, catalogo);

      expect(result).toEqual([]);
    });
  });

  describe('getAvanceConNombre', () => {
    const rut = '12345678-9';
    const codCarrera = 'ECIN';
    const catalogo = '2023';

    const mockAvanceData = [
      {
        course: 'ECIN-00123',
        status: 'APROBADO',
        period: '202310',
        nrc: '12345',
      },
      {
        course: 'ECIN-00456',
        status: 'INSCRITO',
        period: '202320',
        nrc: '67890',
      },
    ];

    const mockMallaData = [
      {
        codigo: 'ECIN-00123',
        asignatura: 'Programación',
        creditos: 5,
        nivel: 1,
      },
      {
        codigo: 'ECIN-00456',
        asignatura: 'Base de Datos',
        creditos: 5,
        nivel: 2,
      },
    ];

    it('should successfully get avance with course names', async () => {
      httpService.axiosRef.get
        .mockResolvedValueOnce({ data: mockAvanceData })
        .mockResolvedValueOnce({ data: mockMallaData });

      const result = await service.getAvanceConNombre(rut, codCarrera, catalogo);

      expect(result).toEqual([
        {
          course: 'ECIN-00123',
          nombre: 'Programación',
          status: 'APROBADO',
          period: '202310',
          nrc: '12345',
        },
        {
          course: 'ECIN-00456',
          nombre: 'Base de Datos',
          status: 'INSCRITO',
          period: '202320',
          nrc: '67890',
        },
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].nombre).toBe('Programación');
      expect(result[1].nombre).toBe('Base de Datos');
    });

    it('should sort results by period', async () => {
      const unsortedAvance = [
        {
          course: 'ECIN-00456',
          status: 'INSCRITO',
          period: '202320',
          nrc: '67890',
        },
        {
          course: 'ECIN-00123',
          status: 'APROBADO',
          period: '202310',
          nrc: '12345',
        },
      ];

      httpService.axiosRef.get
        .mockResolvedValueOnce({ data: unsortedAvance })
        .mockResolvedValueOnce({ data: mockMallaData });

      const result = await service.getAvanceConNombre(rut, codCarrera, catalogo);

      expect(result[0].period).toBe('202310');
      expect(result[1].period).toBe('202320');
    });

    it('should return "Desconocido" for courses not in malla', async () => {
      const avanceWithUnknown = [
        {
          course: 'ECIN-99999',
          status: 'APROBADO',
          period: '202310',
          nrc: '12345',
        },
      ];

      httpService.axiosRef.get
        .mockResolvedValueOnce({ data: avanceWithUnknown })
        .mockResolvedValueOnce({ data: mockMallaData });

      const result = await service.getAvanceConNombre(rut, codCarrera, catalogo);

      expect(result[0].nombre).toBe('Desconocido');
    });

    it('should return error when avance has error', async () => {
      httpService.axiosRef.get.mockResolvedValueOnce({
        data: { error: 'Not found' },
      });

      const result = await service.getAvanceConNombre(rut, codCarrera, catalogo);

      expect(result).toEqual({ error: 'Avance no encontrado' });
      expect(httpService.axiosRef.get).toHaveBeenCalled();
    });
  });
});


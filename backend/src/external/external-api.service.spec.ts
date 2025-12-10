import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { ExternalApiService } from './external-api.service';
import { MallaItem, AvanceItem } from '../projection/types';

describe('ExternalApiService', () => {
  let service: ExternalApiService;
  let httpService: jest.Mocked<HttpService>;

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalApiService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<ExternalApiService>(ExternalApiService);
    httpService = module.get(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMalla', () => {
    const codCarrera = 'ECIN';
    const catalogo = '2023';
    const mockMallaData: MallaItem[] = [
      {
        codigo: 'ECIN-00123',
        asignatura: 'Programación',
        creditos: 5,
        nivel: 1,
        prereq: 'ECIN-00001',
      },
      {
        codigo: 'ECIN-00456',
        asignatura: 'Base de Datos',
        creditos: 5,
        nivel: 2,
        prereq: 'ECIN-00123',
      },
    ];

    it('should successfully get malla data', async () => {
      const mockResponse = {
        data: mockMallaData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getMalla(codCarrera, catalogo);

      expect(result).toEqual(mockMallaData);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(`${codCarrera}-${catalogo}`),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-HAWAII-AUTH': 'jf400fejof13f',
            'User-Agent': 'UCN-Proyeccion/1.0 (+nestjs)',
            Accept: 'application/json',
          }),
        }),
      );
    });

    it('should throw error on non-2xx status', async () => {
      const mockResponse = {
        data: { error: 'Not found' },
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));

      await expect(service.getMalla(codCarrera, catalogo)).rejects.toThrow(
        'Malla API 404',
      );
    });

    it('should throw error on connection failure', async () => {
      const axiosError = {
        message: 'Connection refused',
        code: 'ECONNREFUSED',
        response: undefined,
        request: {},
        config: {},
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getMalla(codCarrera, catalogo)).rejects.toThrow(
        'Malla API error: Connection refused',
      );
    });

    it('should encode URL parameters correctly', async () => {
      const codCarreraWithSpecialChars = 'ECIN-2023';
      const catalogoWithSpecialChars = '2023-1';

      const mockResponse = {
        data: mockMallaData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));

      await service.getMalla(codCarreraWithSpecialChars, catalogoWithSpecialChars);

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(codCarreraWithSpecialChars)),
        expect.any(Object),
      );
    });
  });

  describe('getAvance', () => {
    const rut = '12345678-9';
    const codCarrera = 'ECIN';
    const mockAvanceData: AvanceItem[] = [
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
        status: 'INSCRITO',
      },
    ];

    it('should successfully get avance data', async () => {
      const mockResponse = {
        data: mockAvanceData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getAvance(rut, codCarrera);

      expect(result).toEqual(mockAvanceData);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(`rut=${encodeURIComponent(rut)}`),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'UCN-Proyeccion/1.0 (+nestjs)',
            Accept: 'application/json',
          }),
        }),
      );
    });

    it('should throw error on non-2xx status', async () => {
      const mockResponse = {
        data: { error: 'Not found' },
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));

      await expect(service.getAvance(rut, codCarrera)).rejects.toThrow(
        'Avance API 404',
      );
    });

    it('should throw error on connection failure', async () => {
      const axiosError = {
        message: 'Timeout',
        code: 'ETIMEDOUT',
        response: undefined,
        request: {},
        config: {},
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getAvance(rut, codCarrera)).rejects.toThrow(
        'Avance API error: Timeout',
      );
    });

    it('should encode RUT and codCarrera in URL', async () => {
      const rutWithSpecialChars = '12.345.678-9';
      const codCarreraWithSpecialChars = 'ECIN-2023';

      const mockResponse = {
        data: mockAvanceData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));

      await service.getAvance(rutWithSpecialChars, codCarreraWithSpecialChars);

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(rutWithSpecialChars)),
        expect.any(Object),
      );
    });
  });
});


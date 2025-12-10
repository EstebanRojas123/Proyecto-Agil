import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpService: jest.Mocked<HttpService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockAuthUrl = 'https://test-auth-url.com';

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(mockAuthUrl),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    httpService = module.get(HttpService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const mockRut = '12345678-9';
    const mockCarreras = [
      { codigo: 'ECIN', nombre: 'Ingeniería Civil en Informática' },
    ];

    it('should successfully login and return access token', async () => {
      const mockResponse = {
        data: {
          rut: mockRut,
          carreras: mockCarreras,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      const mockToken = 'mock-jwt-token';

      httpService.get.mockReturnValue(of(mockResponse));
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(email, password);

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          rut: mockRut,
          carreras: mockCarreras,
          email: email,
        },
      });

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('login.php'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'UCN-Proyeccion/1.0 (+nestjs)',
            Accept: 'application/json',
          }),
        }),
      );

      expect(jwtService.sign).toHaveBeenCalledWith({
        rut: mockRut,
        carreras: mockCarreras,
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const mockResponse = {
        data: {
          error: 'Invalid credentials',
        },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));

      await expect(service.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when rut is missing', async () => {
      const mockResponse = {
        data: {
          carreras: mockCarreras,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));

      await expect(service.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when carreras is missing', async () => {
      const mockResponse = {
        data: {
          rut: mockRut,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));

      await expect(service.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw InternalServerErrorException on connection error', async () => {
      const axiosError = {
        message: 'Connection refused',
        code: 'ECONNREFUSED',
        response: undefined,
        request: {},
        config: {},
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.login(email, password)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException on timeout', async () => {
      const axiosError = {
        message: 'Timeout',
        code: 'ETIMEDOUT',
        response: undefined,
        request: {},
        config: {},
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.login(email, password)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException on API error response', async () => {
      const axiosError = {
        message: 'Internal Server Error',
        code: 'ERR_BAD_RESPONSE',
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Server error' },
          headers: {},
          config: {},
        },
        request: {},
        config: {},
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.login(email, password)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should encode email and password in URL', async () => {
      const emailWithSpecialChars = 'test+user@example.com';
      const passwordWithSpecialChars = 'p@ssw0rd!';

      const mockResponse = {
        data: {
          rut: mockRut,
          carreras: mockCarreras,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      httpService.get.mockReturnValue(of(mockResponse));
      jwtService.sign.mockReturnValue('token');

      await service.login(emailWithSpecialChars, passwordWithSpecialChars);

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(emailWithSpecialChars)),
        expect.any(Object),
      );
    });
  });
});


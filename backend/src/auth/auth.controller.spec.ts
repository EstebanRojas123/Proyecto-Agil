import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const mockLoginResult = {
      access_token: 'mock-token',
      user: {
        rut: '12345678-9',
        carreras: [],
        email: email,
      },
    };

    it('should successfully login and return result', async () => {
      authService.login.mockResolvedValue(mockLoginResult);

      const result = await controller.login({ email, password });

      expect(result).toEqual(mockLoginResult);
      expect(authService.login).toHaveBeenCalledWith(email, password);
    });

    it('should throw error when login fails', async () => {
      const error = new UnauthorizedException('Invalid credentials');
      authService.login.mockRejectedValue(error);

      await expect(controller.login({ email, password })).rejects.toThrow(
        UnauthorizedException,
      );

      expect(authService.login).toHaveBeenCalledWith(email, password);
    });

    it('should handle empty email', async () => {
      const error = new UnauthorizedException('Invalid credentials');
      authService.login.mockRejectedValue(error);

      await expect(
        controller.login({ email: '', password }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle empty password', async () => {
      const error = new UnauthorizedException('Invalid credentials');
      authService.login.mockRejectedValue(error);

      await expect(
        controller.login({ email, password: '' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});


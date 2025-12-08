import { Body, Controller, Post, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    this.logger.log(`[CONTROLLER] Solicitud de login recibida para: ${body.email}`);
    try {
      const result = await this.authService.login(body.email, body.password);
      this.logger.log(`[CONTROLLER] Login exitoso para: ${body.email}`);
      return result;
    } catch (error) {
      this.logger.error(`[CONTROLLER] Error en login para: ${body.email}`, error);
      throw error;
    }
  }
}

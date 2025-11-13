import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map, retry } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class AuthService {
  private readonly authUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.authUrl = this.configService.get<string>('auth.url');
  }

  async login(email: string, password: string) {
    try {
      const resp = await lastValueFrom(
        this.http
          .post(
            `${this.authUrl}/login.php`,
            { email, password }, // POST body, no query string
            {
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'UCN-Proyeccion/1.0 (+nestjs)',
                Accept: 'application/json',
              },
              validateStatus: () => true, // Aceptar todos los códigos de estado
            },
          )
          .pipe(
            retry({ count: 0 }),
            map((r) => r),
          ),
      );

      const { data } = resp;

      // Validar respuesta antes de acceder a propiedades
      if (data.error || !data.rut || !data.carreras) {
        throw new UnauthorizedException('Credenciales incorrectas');
      }

      const payload = {
        rut: data.rut,
        carreras: data.carreras,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          ...payload,
          email: email, // Agregar email al objeto user
        },
      };
    } catch (error) {
      // Si ya es una excepción de NestJS, re-lanzarla
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Para otros errores (red, timeout, etc.), lanzar error interno
      const err = error as AxiosError;
      throw new InternalServerErrorException(
        `Error al autenticar: ${err.message || 'Error desconocido'}`,
      );
    }
  }
}

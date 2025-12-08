import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map, retry } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class AuthService {
  private readonly authUrl: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly http: HttpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const authUrl = this.configService.get<string>('auth.url');
    if (!authUrl) {
      throw new Error('AUTH_URL no está configurada en las variables de entorno');
    }
    this.authUrl = authUrl;
    this.logger.log(`AuthService inicializado con AUTH_URL: ${this.authUrl}`);
  }

  async login(email: string, password: string) {
    const startTime = Date.now();
    const loginUrl = `${this.authUrl}/login.php?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    this.logger.log(`[LOGIN] Iniciando autenticación para: ${email}`);
    this.logger.log(`[LOGIN] URL de autenticación: ${this.authUrl}/login.php`);
    this.logger.log(`[LOGIN] Método: GET con query parameters`);

    try {
      const resp = await lastValueFrom(
        this.http
          .get(
            loginUrl,
            {
              headers: {
                'User-Agent': 'UCN-Proyeccion/1.0 (+nestjs)',
                Accept: 'application/json',
              },
              validateStatus: () => true,
            },
          )
          .pipe(
            retry({ count: 0 }),
            map((r) => r),
          ),
      );

      const responseTime = Date.now() - startTime;
      
      this.logger.log(`[LOGIN] Respuesta recibida del servicio externo (${responseTime}ms):`, {
        url: `${this.authUrl}/login.php?email=${encodeURIComponent(email)}&password=***`,
        status: resp.status,
        statusText: resp.statusText,
        tieneData: !!resp.data,
        tipoData: typeof resp.data,
        dataCompleta: JSON.stringify(resp.data, null, 2),
      });

      const { data } = resp;
      if (data.error || !data.rut || !data.carreras) {
        this.logger.error(`[LOGIN] ⚠️ CREDENCIALES INVÁLIDAS para: ${email}`, {
          error: data.error,
          mensajeError: data.message || data.error || 'Sin mensaje de error',
          tieneRut: !!data.rut,
          tieneCarreras: !!data.carreras,
          rut: data.rut || 'NO PRESENTE',
          carreras: data.carreras || 'NO PRESENTE',
          respuestaCompleta: JSON.stringify(data, null, 2),
          estructuraRespuesta: Object.keys(data || {}),
        });
        
        const errorMessage = data.message || data.error || 'Credenciales incorrectas';
        throw new UnauthorizedException(errorMessage);
      }

      const payload = {
        rut: data.rut,
        carreras: data.carreras,
      };

      this.logger.log(`[LOGIN] Autenticación exitosa para: ${email}`, {
        rut: data.rut,
        cantidadCarreras: data.carreras?.length || 0,
      });

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          ...payload,
          email: email,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof UnauthorizedException) {
        this.logger.warn(`[LOGIN] UnauthorizedException (${responseTime}ms):`, error.message);
        throw error;
      }

      const err = error as AxiosError;
      const errorDetails = {
        mensaje: err.message,
        codigo: err.code,
        urlIntentada: `${this.authUrl}/login.php`,
        respuesta: err.response ? {
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers,
          data: JSON.stringify(err.response.data, null, 2),
        } : null,
        request: err.request ? {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers,
        } : null,
        tiempo: `${responseTime}ms`,
        stack: err.stack,
      };

      this.logger.error(`[LOGIN] ERROR DE CONEXIÓN con API externa (${responseTime}ms):`, errorDetails);
      
      let errorMessage = 'Error desconocido';
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        errorMessage = `No se pudo conectar con el servicio de autenticación (${this.authUrl}). Verifica que la URL sea correcta y que el servicio esté disponible.`;
      } else if (err.code === 'ETIMEDOUT') {
        errorMessage = 'El servicio de autenticación no respondió a tiempo. Por favor, intenta nuevamente.';
      } else if (err.response) {
        errorMessage = `El servicio de autenticación respondió con error ${err.response.status}: ${err.response.statusText}`;
      } else {
        errorMessage = `Error al autenticar: ${err.message || 'Error desconocido'}`;
      }

      throw new InternalServerErrorException(errorMessage);
    }
  }
}

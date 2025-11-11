import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly http: HttpService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const { data } = await this.http.axiosRef.get(
      `https://puclaro.ucn.cl/eross/avance/login.php?email=${email}&password=${password}`,
    );

    if (data.error) {
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
  }
}

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AvanceService {
  private readonly avanceUrl = 'https://puclaro.ucn.cl/eross/avance/avance.php';
  private readonly mallaUrl = 'https://losvilos.ucn.cl/hawaii/api/mallas';

  constructor(private readonly http: HttpService) {}

  async getAvance(rut: string, codCarrera: string) {
    const { data } = await this.http.axiosRef.get(
      `${this.avanceUrl}?rut=${rut}&codcarrera=${codCarrera}`,
    );
    return data;
  }

  async getMalla(codCarrera: string, catalogo: string) {
    const { data } = await this.http.axiosRef.get(
      `${this.mallaUrl}?${codCarrera}-${catalogo}`,
      {
        headers: { 'X-HAWAII-AUTH': 'jf400fejof13f' },
      },
    );
    return data;
  }

  async getAvanceConNombre(rut: string, codCarrera: string, catalogo: string) {
    const avance = await this.getAvance(rut, codCarrera);
    if (avance.error) {
      return { error: 'Avance no encontrado' };
    }

    const malla = await this.getMalla(codCarrera, catalogo);

    const mapaMalla = new Map(malla.map((m) => [m.codigo, m.asignatura]));

    const resultado = avance.map((a) => ({
      course: a.course,
      nombre: mapaMalla.get(a.course) || 'Desconocido',
      status: a.status,
      period: a.period,
      nrc: a.nrc,
    }));

    resultado.sort((a, b) => a.period.localeCompare(b.period));

    return resultado;
  }
}

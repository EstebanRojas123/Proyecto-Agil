import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map, retry } from 'rxjs';
import { AxiosError } from 'axios';
import { MallaItem, AvanceItem } from '../projection/types';

@Injectable()
export class ExternalApiService {
  constructor(private readonly http: HttpService) {}

  async getMalla(codCarrera: string, catalogo: string): Promise<MallaItem[]> {
    const url = `https://losvilos.ucn.cl/hawaii/api/mallas?${encodeURIComponent(codCarrera)}-${encodeURIComponent(catalogo)}`;

    try {
      const resp = await lastValueFrom(
        this.http
          .get(url, {
            headers: {
              'X-HAWAII-AUTH': 'jf400fejof13f',
              'User-Agent': 'UCN-Proyeccion/1.0 (+nestjs)',
              Accept: 'application/json',
            },
            validateStatus: () => true,
          })
          .pipe(
            retry({ count: 0 }),
            map((r) => r),
          ),
      );

      if (resp.status >= 200 && resp.status < 300) {
        return resp.data as MallaItem[];
      }

      const body =
        typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
      throw new Error(`Malla API ${resp.status}: ${body}`);
    } catch (e) {
      const err = e as AxiosError;
      throw new Error(`Malla API error: ${err.message}`);
    }
  }

  async getAvance(rut: string, codCarrera: string): Promise<AvanceItem[]> {
    const url = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${encodeURIComponent(
      rut,
    )}&codcarrera=${encodeURIComponent(codCarrera)}`;

    try {
      const resp = await lastValueFrom(
        this.http
          .get(url, {
            headers: {
              'User-Agent': 'UCN-Proyeccion/1.0 (+nestjs)',
              Accept: 'application/json',
            },
            validateStatus: () => true,
          })
          .pipe(
            retry({ count: 0 }),
            map((r) => r),
          ),
      );

      if (resp.status >= 200 && resp.status < 300) {
        return resp.data as AvanceItem[];
      }

      const body =
        typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
      throw new Error(`Avance API ${resp.status}: ${body}`);
    } catch (e) {
      const err = e as AxiosError;
      throw new Error(`Avance API error: ${err.message}`);
    }
  }
}

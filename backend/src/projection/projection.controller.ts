// src/projection/projection.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ProjectionService } from './projection.service';
import { ProyeccionResponse } from './types';
import { AutomaticProjectionService } from './automatic-projection.service';

@Controller('projection')
export class ProjectionController {
  constructor(
    private readonly service: ProjectionService,
    private readonly automatic: AutomaticProjectionService,
  ) {}

  @Get()
  async getProjection(
    @Query('rut') rut: string,
    @Query('codcarrera') codcarrera: string,
    @Query('catalogo') catalogo: string,
  ): Promise<ProyeccionResponse> {
    if (!rut || !codcarrera || !catalogo) {
      throw new Error('Faltan parámetros: rut, codcarrera, catalogo');
    }
    return this.service.buildProjection({
      rut,
      codCarrera: codcarrera,
      catalogo,
    });
  }

  @Get('automatic-projection')
  async getAutomaticProjection(
    @Query('rut') rut: string,
    @Query('codcarrera') codcarrera: string,
    @Query('catalogo') catalogo: string,
  ): Promise<ProyeccionResponse> {
    if (!rut || !codcarrera || !catalogo) {
      throw new Error('Faltan parámetros: rut, codcarrera, catalogo');
    }
    return this.automatic.buildAutomaticProjection({
      rut,
      codCarrera: codcarrera,
      catalogo,
    });
  }
}

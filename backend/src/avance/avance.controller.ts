import { Controller, Get, Query } from '@nestjs/common';
import { AvanceService } from './avance.service';

@Controller('avance')
export class AvanceController {
  constructor(private readonly avanceService: AvanceService) {}

  @Get()
  async getAvance(
    @Query('rut') rut: string,
    @Query('codCarrera') codCarrera: string,
    @Query('catalogo') catalogo: string,
  ) {
    return this.avanceService.getAvanceConNombre(rut, codCarrera, catalogo);
  }
}

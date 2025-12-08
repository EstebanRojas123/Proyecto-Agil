import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';

import { ManualProjectionService } from './manual-projection.service';
import { CreateManualProjectionDto } from './dtos/create-manual-projection.dto';

@Controller('manual-projections')
export class ManualProjectionController {
  constructor(
    private readonly manualProjectionService: ManualProjectionService,
  ) {}

  @Post()
  create(@Body() dto: CreateManualProjectionDto) {
    return this.manualProjectionService.createFromManualJson(dto);
  }

  @Get('user/:rut')
  findByUser(@Param('rut') rut: string) {
    return this.manualProjectionService.findByUser(rut);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.manualProjectionService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.manualProjectionService.remove(id);
  }
}

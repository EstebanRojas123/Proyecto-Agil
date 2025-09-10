import { Controller, Get, Post, Body } from '@nestjs/common';
import { DoggyService } from './doggy.service';
import { Doggy } from './doggy.entity';

@Controller('doggy')
export class DoggyController {
  constructor(private readonly doggyService: DoggyService) {}

  @Post()
  create(@Body('name') name: string): Promise<Doggy> {
    return this.doggyService.create(name);
  }

  @Get()
  findAll(): Promise<Doggy[]> {
    return this.doggyService.findAll();
  }
}

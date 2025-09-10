import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doggy } from './doggy.entity';
import { DoggyService } from './doggy.service';
import { DoggyController } from './doggy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Doggy])],
  providers: [DoggyService],
  controllers: [DoggyController],
})
export class DoggyModule {}

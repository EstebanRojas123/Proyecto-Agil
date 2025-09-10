import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doggy } from './doggy.entity';

@Injectable()
export class DoggyService {
  constructor(
    @InjectRepository(Doggy)
    private doggyRepository: Repository<Doggy>,
  ) {}

  create(name: string): Promise<Doggy> {
    const doggy = this.doggyRepository.create({ name });
    return this.doggyRepository.save(doggy);
  }

  findAll(): Promise<Doggy[]> {
    return this.doggyRepository.find();
  }
}

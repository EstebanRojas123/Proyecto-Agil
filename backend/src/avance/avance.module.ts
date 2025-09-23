import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AvanceController } from './avance.controller';
import { AvanceService } from './avance.service';

@Module({
  imports: [HttpModule],
  controllers: [AvanceController],
  providers: [AvanceService],
})
export class AvanceModule {}

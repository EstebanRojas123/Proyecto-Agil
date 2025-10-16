// src/projection/projection.module.ts
import { Module } from '@nestjs/common';
import { ProjectionController } from './projection.controller';
import { ProjectionService } from './projection.service';
import { ExternalApiModule } from '../external/external-api.module';

@Module({
  imports: [ExternalApiModule],
  controllers: [ProjectionController],
  providers: [ProjectionService],
})
export class ProjectionModule {}

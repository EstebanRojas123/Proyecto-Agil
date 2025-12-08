import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { ManualProjection } from './entities/manual-projection.entity';
import { ProjectedSemester } from './entities/projected-semester.entity';
import { ProjectedCourse } from './entities/projected-course.entity';

import { ManualProjectionService } from './manual-projection.service';
import { ManualProjectionController } from './manual-projection.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ManualProjection,
      ProjectedSemester,
      ProjectedCourse,
    ]),
  ],
  controllers: [ManualProjectionController],
  providers: [ManualProjectionService],
  exports: [ManualProjectionService],
})
export class ManualProjectionModule {}

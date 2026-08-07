import { Module } from '@nestjs/common';
import { FilieresService } from './filieres.service';
import { FilieresController } from './filieres.controller';

@Module({
  controllers: [FilieresController],
  providers: [FilieresService],
  exports: [FilieresService]
})
export class FilieresModule {}

import { Module } from '@nestjs/common';
import { EnseignantsController } from './enseignats.controller';
import { EnseignantsService } from './enseignats.service';

@Module({
  controllers: [EnseignantsController],
  providers: [EnseignantsService],
  exports: [EnseignantsService],
})
export class EnseignantsModule {}

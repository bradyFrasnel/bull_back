import { Module } from '@nestjs/common';
import { CalculsController } from './calculs.controller';
import { CalculsService } from './calculs.service';

@Module({
  controllers: [CalculsController],
  providers: [CalculsService],
  exports: [CalculsService],
})
export class CalculsModule {}

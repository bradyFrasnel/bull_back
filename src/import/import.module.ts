import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { CalculsModule } from '../calculs/calculs.module';

@Module({
  imports: [CalculsModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}

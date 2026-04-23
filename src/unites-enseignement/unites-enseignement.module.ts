import { Module } from '@nestjs/common';
import { UnitesEnseignementController } from './unites-enseignement.controller';
import { UnitesEnseignementService } from './unites-enseignement.service';

@Module({
  controllers: [UnitesEnseignementController],
  providers: [UnitesEnseignementService],
  exports: [UnitesEnseignementService],
})
export class UnitesEnseignementModule {}

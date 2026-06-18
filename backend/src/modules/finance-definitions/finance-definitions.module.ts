import { Module } from '@nestjs/common';
import { FinanceDefinitionsController } from './finance-definitions.controller';
import { FinanceDefinitionsService } from './finance-definitions.service';

@Module({
  controllers: [FinanceDefinitionsController],
  providers: [FinanceDefinitionsService],
  exports: [FinanceDefinitionsService],
})
export class FinanceDefinitionsModule {}

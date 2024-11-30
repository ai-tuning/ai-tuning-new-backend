import { Module } from '@nestjs/common';
import { DtcService } from './dtc.service';
import { DtcController } from './dtc.controller';

@Module({
  controllers: [DtcController],
  providers: [DtcService],
})
export class DtcModule {}

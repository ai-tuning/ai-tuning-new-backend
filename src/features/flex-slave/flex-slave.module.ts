import { Module } from '@nestjs/common';
import { FlexSlaveService } from './flex-slave.service';
import { FlexSlaveController } from './flex-slave.controller';

@Module({
  controllers: [FlexSlaveController],
  providers: [FlexSlaveService],
})
export class FlexSlaveModule {}

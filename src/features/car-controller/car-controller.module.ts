import { Module } from '@nestjs/common';
import { CarControllerService } from './car-controller.service';
import { CarControllerController } from './car-controller.controller';

@Module({
  controllers: [CarControllerController],
  providers: [CarControllerService],
})
export class CarControllerModule {}

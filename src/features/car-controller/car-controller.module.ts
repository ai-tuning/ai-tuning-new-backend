import { Module } from '@nestjs/common';
import { CarControllerService } from './car-controller.service';
import { CarControllerController } from './car-controller.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CarControllerSchema } from './schema/car-controller.schema';
import { collectionsName } from '../constant';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: collectionsName.controller, schema: CarControllerSchema },
      {
        name: collectionsName.car,
        schema: CarControllerSchema,
      },
    ]),
  ],
  controllers: [CarControllerController],
  providers: [CarControllerService],
  exports: [CarControllerService],
})
export class CarControllerModule {}

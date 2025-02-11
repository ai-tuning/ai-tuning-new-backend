import { Module } from '@nestjs/common';
import { CarControllerService } from './car-controller.service';
import { CarControllerController } from './car-controller.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CarControllerSchema } from './schema/car-controller.schema';
import { collectionsName } from '../constant';
import { PathService } from '../common';

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
  providers: [CarControllerService, PathService],
  exports: [CarControllerService],
})
export class CarControllerModule {}

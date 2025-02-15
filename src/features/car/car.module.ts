import { Module } from '@nestjs/common';
import { CarService } from './car.service';
import { CarController } from './car.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { CarSchema } from './schema/car.schema';
import { CarControllerSchema } from '../car-controller/schema/car-controller.schema';
import { MulterModule, PathService } from '../common';

@Module({
  imports: [
    MulterModule.register({
      acceptedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      destination: './public/car-logos',
      errorMessages: 'Please upload a valid file',
    }),
    MongooseModule.forFeature([
      { name: collectionsName.car, schema: CarSchema },
      { name: collectionsName.controller, schema: CarControllerSchema },
    ]),
  ],
  controllers: [CarController],
  providers: [CarService, PathService],
  exports: [CarService],
})
export class CarModule {}

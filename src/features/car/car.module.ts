import { Module } from '@nestjs/common';
import { CarService } from './car.service';
import { CarController } from './car.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { CarSchema } from './schema/car.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: collectionsName.car, schema: CarSchema }])],
  controllers: [CarController],
  providers: [CarService],
})
export class CarModule {}

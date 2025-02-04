import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { Model, Types } from 'mongoose';
import { Car } from './schema/car.schema';

@Injectable()
export class CarService {
  constructor(@InjectModel(collectionsName.car) private readonly carModel: Model<Car>) {}
  async create(createCarDto: CreateCarDto) {
    const isExist = await this.carModel.findOne({ name: createCarDto.name, admin: createCarDto.admin });
    if (isExist) {
      throw new BadRequestException('Car already exist');
    }
    const Car = new this.carModel(createCarDto);
    return Car.save();
  }

  findByAdmin(adminId: Types.ObjectId) {
    return this.carModel.find({ admin: adminId }).lean<Car[]>();
  }

  async update(id: Types.ObjectId, updateCarDto: UpdateCarDto) {
    const isExist = await this.carModel.findOne({
      name: updateCarDto.name,
      _id: { $ne: id },
      admin: updateCarDto.admin,
    });
    if (isExist) {
      throw new BadRequestException('Car already exist');
    }

    return this.carModel.findOneAndUpdate({ _id: id }, { $set: updateCarDto }, { new: true }).lean<Car>();
  }

  remove(id: Types.ObjectId) {
    return this.carModel.findByIdAndDelete({ _id: id });
  }
}

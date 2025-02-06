import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { Connection, Model, Types } from 'mongoose';
import { Car } from './schema/car.schema';
import { CarController } from '../car-controller/schema/car-controller.schema';

@Injectable()
export class CarService {
  constructor(
    @InjectModel(collectionsName.car) private readonly carModel: Model<Car>,
    @InjectModel(collectionsName.controller) private readonly carControllerModel: Model<CarController>,
    @InjectConnection() private readonly connection: Connection,
  ) {}
  async create(createCarDto: CreateCarDto) {
    const session = await this.connection.startSession();
    let carPath: string;
    let isDirCreated = false;
    try {
      session.startTransaction();
      const isExist = await this.carModel.findOne({ name: createCarDto.name, admin: createCarDto.admin });
      if (isExist) {
        throw new BadRequestException('Car already exist');
      }
      carPath = path.join(
        process.cwd(),
        'public',
        createCarDto.admin.toString(),
        createCarDto.makeType,
        createCarDto.name,
      );

      const car = new this.carModel(createCarDto);
      const newCar = await car.save({ session });

      //create folder
      if (!fs.existsSync(carPath)) {
        fs.mkdirSync(carPath, { recursive: true });
        isDirCreated = true;
      }
      await session.commitTransaction();
      return newCar;
    } catch (error) {
      if (isDirCreated) fs.rmSync(carPath, { recursive: true, force: true });
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findByAdmin(adminId: Types.ObjectId) {
    return this.carModel.find({ admin: adminId }).lean<Car[]>();
  }

  async findById(id: Types.ObjectId) {
    return this.carModel.findById(id).lean<Car>();
  }

  async update(id: Types.ObjectId, updateCarDto: UpdateCarDto) {
    const session = await this.connection.startSession();
    let oldPath: string;
    let newPath: string;
    let isRenamed = false;
    try {
      session.startTransaction();
      const isExist = await this.carModel.findOne({
        name: updateCarDto.name,
        _id: { $ne: id },
        admin: updateCarDto.admin,
      });

      if (isExist) {
        throw new BadRequestException('Car already exist');
      }
      const previousCar = await this.carModel.findById(id).lean<Car>();
      if (!previousCar) {
        throw new BadRequestException('Car not found');
      }

      oldPath = path.join(
        process.cwd(),
        'public',
        previousCar.admin.toString(),
        previousCar.makeType,
        previousCar.name,
      );

      newPath = path.join(
        process.cwd(),
        'public',
        previousCar.admin.toString(),
        updateCarDto.makeType,
        updateCarDto.name,
      );

      const updatedCar = await this.carModel
        .findOneAndUpdate({ _id: id }, { $set: updateCarDto }, { new: true, session })
        .lean<Car>();

      if (oldPath !== newPath) {
        if (fs.existsSync(oldPath)) {
          await fs.promises.rename(oldPath, newPath);
          isRenamed = true;
        }
      }

      await session.commitTransaction();
      return updatedCar;
    } catch (error) {
      if (isRenamed) await fs.promises.rename(newPath, oldPath);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async remove(id: Types.ObjectId) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();
      const deletedCar = await this.carModel.findByIdAndDelete({ _id: id }, { session });

      if (!deletedCar) {
        throw new BadRequestException('Car not found');
      }

      //delete controller
      const deletedController = await this.carControllerModel.exists({ car: deletedCar._id }).lean();
      if (deletedController) {
        await this.carControllerModel.deleteMany({ car: deletedCar._id });
      }

      const carPath = path.join(
        process.cwd(),
        'public',
        deletedCar.admin.toString(),
        deletedCar.makeType,
        deletedCar.name,
      );

      if (fs.existsSync(carPath)) {
        fs.rmSync(carPath, { recursive: true, force: true });
      }

      await session.commitTransaction();
      return deletedCar;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

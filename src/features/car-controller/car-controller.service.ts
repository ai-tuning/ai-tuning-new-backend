import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CreateCarControllerDto } from './dto/create-car-controller.dto';
import { UpdateCarControllerDto } from './dto/update-car-controller.dto';
import { Car } from '../car/schema/car.schema';
import { Connection, Model, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { CarController } from './schema/car-controller.schema';

@Injectable()
export class CarControllerService {
  constructor(
    @InjectModel(collectionsName.car) private readonly carModel: Model<Car>,
    @InjectModel(collectionsName.controller) private readonly carControllerModel: Model<CarController>,
    @InjectConnection() private readonly connection: Connection,
  ) {}
  async create(createCarControllerDto: CreateCarControllerDto) {
    const session = await this.connection.startSession();
    let controllerPath: string;
    let isDirCreated = false;
    try {
      session.startTransaction();
      const car = await this.carModel
        .findById(createCarControllerDto.car)
        .select('makeType name')
        .lean<Car>()
        .session(session);

      if (!car) {
        throw new BadRequestException('Car not found');
      }

      controllerPath = path.join(
        process.cwd(),
        'public',
        createCarControllerDto.admin.toString(),
        car.makeType,
        car.name,
        createCarControllerDto.name,
      );

      const isExist = await this.carControllerModel.findOne({
        name: createCarControllerDto.name,
        admin: createCarControllerDto.admin,
      });

      if (isExist) {
        throw new BadRequestException('Car already exist');
      }
      const carController = new this.carControllerModel(createCarControllerDto);
      const newController = await carController.save({ session });

      //create folder
      if (!fs.existsSync(controllerPath)) {
        fs.mkdirSync(controllerPath, { recursive: true });
        isDirCreated = true;
      }

      await session.commitTransaction();
      return newController;
    } catch (error) {
      await session.abortTransaction();
      if (isDirCreated) fs.rmSync(controllerPath, { recursive: true, force: true });
      throw error;
    } finally {
      await session.endSession();
    }
  }

  findByAdmin(adminId: Types.ObjectId) {
    return this.carControllerModel.find({ admin: adminId }).lean<CarController[]>();
  }

  findById(controllerId: Types.ObjectId) {
    return this.carControllerModel.findById(controllerId).lean<CarController>();
  }

  async update(id: Types.ObjectId, updateControllerDto: UpdateCarControllerDto) {
    const session = await this.connection.startSession();
    let oldPath: string;
    let newPath: string;
    let isRenamed = false;
    try {
      session.startTransaction();
      const isExist = await this.carControllerModel.findOne({
        name: updateControllerDto.name,
        _id: { $ne: id },
        admin: updateControllerDto.admin,
      });
      if (isExist) {
        throw new BadRequestException('Car already exist');
      }

      const previousCar = await this.carModel.findById(updateControllerDto.car).lean<Car>();
      if (!previousCar) {
        throw new BadRequestException('Car not found');
      }

      const previousController = await this.carControllerModel.findById(id).lean<CarController>();
      if (!previousController) {
        throw new BadRequestException('Controller not found');
      }

      oldPath = path.join(
        process.cwd(),
        'public',
        previousCar.admin.toString(),
        previousCar.makeType,
        previousCar.name,
        previousController.name,
      );

      newPath = path.join(
        process.cwd(),
        'public',
        previousCar.admin.toString(),
        previousCar.makeType,
        previousCar.name,
        updateControllerDto.name,
      );

      const updatedController = await this.carControllerModel
        .findOneAndUpdate({ _id: id }, { $set: updateControllerDto }, { new: true })
        .lean<Car>();

      if (oldPath !== newPath) {
        if (fs.existsSync(oldPath)) {
          await fs.promises.rename(oldPath, newPath);
          isRenamed = true;
        }
      }

      await session.commitTransaction();
      return updatedController;
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
      const deletedController = await this.carControllerModel.findByIdAndDelete({ _id: id }, { session });

      if (!deletedController) {
        throw new BadRequestException('Controller not found');
      }

      const car = await this.carModel.findById(deletedController.car).select('makeType name').lean<Car>();

      if (!car) {
        throw new BadRequestException('Car not found');
      }

      const carPath = path.join(
        process.cwd(),
        'public',
        deletedController.admin.toString(),
        car.makeType,
        car.name,
        deletedController.name,
      );

      if (fs.existsSync(carPath)) {
        fs.rmSync(carPath, { recursive: true, force: true });
      }
      await session.commitTransaction();
      return deletedController;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

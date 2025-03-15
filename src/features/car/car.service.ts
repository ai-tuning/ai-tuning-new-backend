import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { Connection, Model, Types } from 'mongoose';
import { Car, CarDocument } from './schema/car.schema';
import { CarController } from '../car-controller/schema/car-controller.schema';
import { PathService } from '../common';

@Injectable()
export class CarService {
  constructor(
    @InjectModel(collectionsName.car) private readonly carModel: Model<Car>,
    @InjectModel(collectionsName.controller) private readonly carControllerModel: Model<CarController>,
    @InjectConnection() private readonly connection: Connection,
    private readonly pathService: PathService,
  ) {}

  async create(createCarDto: CreateCarDto) {
    const session = await this.connection.startSession();
    let carPath: string;
    let isDirCreated = false;
    try {
      session.startTransaction();
      const isExist = await this.carModel.findOne({ name: createCarDto.name.trim(), admin: createCarDto.admin });
      if (isExist) {
        throw new BadRequestException('Car already exist');
      }

      const rootScriptPath = this.pathService.getRootScriptPath(createCarDto.admin, createCarDto.makeType);
      carPath = path.join(rootScriptPath, createCarDto.name.trim());

      const car = new this.carModel({ ...createCarDto, name: createCarDto.name.trim() });
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

  async findAll() {
    return this.carModel.find().sort({ name: 1 }).lean<Car[]>();
  }

  async findByAdmin(adminId: Types.ObjectId) {
    return this.carModel.find({ admin: adminId }).sort({ name: 1 }).lean<Car[]>();
  }

  async findById(id: Types.ObjectId) {
    return this.carModel.findById(id).lean<Car>();
  }

  async findByIdAndSelect(id: Types.ObjectId, selects: Array<keyof CarDocument>) {
    return this.carModel.findById(id).select(selects.join(' ')).lean<CarDocument>();
  }

  async update(id: Types.ObjectId, updateCarDto: UpdateCarDto) {
    const session = await this.connection.startSession();
    let oldPath: string;
    let newPath: string;
    let isRenamed = false;
    try {
      session.startTransaction();
      const isExist = await this.carModel.findOne({
        name: updateCarDto.name.trim(),
        _id: { $ne: id },
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
        updateCarDto.admin.toString(),
        previousCar.makeType,
        previousCar.name,
      );

      newPath = path.join(
        process.cwd(),
        'public',
        updateCarDto.admin.toString(),
        updateCarDto.makeType,
        updateCarDto.name.trim(),
      );

      const updatedCar = await this.carModel
        .findOneAndUpdate(
          { _id: id },
          { $set: { ...updateCarDto, name: updateCarDto.name.trim() } },
          { new: true, session },
        )
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

      const getCompleteScriptPath = this.pathService.getRootScriptPath(deletedCar.admin, deletedCar.makeType);
      const carPath = path.join(getCompleteScriptPath, deletedCar.name.trim());

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

  async uploadLogo(id: Types.ObjectId, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Logo is required');
    }
    console.log(file);
    const car = await this.carModel.findById(id);

    if (!car) {
      throw new BadRequestException('Car not found');
    }

    if (car.logo) {
      const getLogoPath = this.pathService.getCarLogoPath();
      if (fs.existsSync(path.join(getLogoPath, car.logo))) {
        fs.unlinkSync(path.join(getLogoPath, car.logo));
      }
    }
    const updatedCar = await this.carModel.findByIdAndUpdate(id, { $set: { logo: file.filename } }, { new: true });
    return updatedCar;
  }

  // async manualCarCreation(adminId) {
  //   const carsPayload = cars.map((car) => ({
  //     name: car.carname.trim(),
  //     makeType: car.makeType,
  //     Id: car.Id,
  //     admin: adminId,
  //   }));

  //   await this.carModel.insertMany(carsPayload);
  //   const insertedCars = await this.carModel.find({ admin: adminId }).lean();

  //   insertedCars.forEach(async (car) => {
  //     const rootScriptPath = this.pathService.getRootScriptPath(adminId, car.makeType);
  //     const carPath = path.join(rootScriptPath, car.name.trim());
  //     if (!fs.existsSync(carPath)) {
  //       fs.mkdirSync(carPath, { recursive: true });
  //     }
  //     const carController = controllers.filter((controller) => controller.makeId == car.Id);

  //     const makeControllerPayload = carController.map((controller) => ({
  //       name: controller.controllername.trim(),
  //       car: car._id,
  //       admin: adminId,
  //     }));

  //     await this.carControllerModel.insertMany(makeControllerPayload);

  //     const insertedControllers = await this.carControllerModel.find({ car: car._id }).lean();

  //     insertedControllers.forEach(async (controller) => {
  //       const controllerPath = this.pathService.getCompleteScriptPath(
  //         adminId,
  //         car.makeType,
  //         car.name.trim(),
  //         controller.name.trim(),
  //       );

  //       if (!fs.existsSync(controllerPath)) {
  //         fs.mkdirSync(controllerPath, { recursive: true });
  //       }
  //     });
  //   });
  // }
}

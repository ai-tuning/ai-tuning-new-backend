import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CreateCarControllerDto } from './dto/create-car-controller.dto';
import { UpdateCarControllerDto } from './dto/update-car-controller.dto';
import { Car } from '../car/schema/car.schema';
import { Connection, Model, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { CarController, ControllerDocument } from './schema/car-controller.schema';
import { PathService } from '../common';

@Injectable()
export class CarControllerService {
    constructor(
        @InjectModel(collectionsName.car) private readonly carModel: Model<Car>,
        @InjectModel(collectionsName.controller) private readonly carControllerModel: Model<CarController>,
        @InjectConnection() private readonly connection: Connection,
        private readonly pathService: PathService,
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

            controllerPath = this.pathService.getCompleteScriptPath(
                createCarControllerDto.admin,
                car.makeType,
                car.name,
                createCarControllerDto.name.trim(),
            );

            const isExist = await this.carControllerModel.findOne({
                name: createCarControllerDto.name.trim(),
                admin: createCarControllerDto.admin,
            });

            if (isExist) {
                throw new BadRequestException('Car already exist');
            }
            const carController = new this.carControllerModel({
                ...createCarControllerDto,
                name: createCarControllerDto.name.trim(),
            });
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

    async findAll() {
        return this.carControllerModel.find().sort({ name: 1 }).lean<CarController[]>();
    }

    findByAdmin(adminId: Types.ObjectId) {
        return this.carControllerModel.find({ admin: adminId }).sort({ name: 1 }).lean<CarController[]>();
    }

    findById(controllerId: Types.ObjectId) {
        return this.carControllerModel.findById(controllerId).lean<CarController>();
    }

    async findByIdAndSelect(id: Types.ObjectId, selects: Array<keyof ControllerDocument>) {
        return this.carControllerModel.findById(id).select(selects.join(' ')).lean<ControllerDocument>();
    }

    async update(id: Types.ObjectId, updateControllerDto: UpdateCarControllerDto) {
        const session = await this.connection.startSession();
        let oldPath: string;
        let newPath: string;
        let isRenamed = false;
        try {
            session.startTransaction();
            const isExist = await this.carControllerModel.findOne({
                name: updateControllerDto.name.trim(),
                _id: { $ne: id },
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

            oldPath = this.pathService.getCompleteScriptPath(
                updateControllerDto.admin,
                previousCar.makeType,
                previousCar.name,
                previousController.name,
            );

            newPath = this.pathService.getCompleteScriptPath(
                updateControllerDto.admin,
                previousCar.makeType,
                previousCar.name,
                updateControllerDto.name.trim(),
            );

            const updatedController = await this.carControllerModel
                .findOneAndUpdate(
                    { _id: id },
                    { $set: { ...updateControllerDto, name: updateControllerDto.name.trim() } },
                    { new: true },
                )
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

            const getCompleteScriptPath = this.pathService.getCompleteScriptPath(
                deletedController.admin,
                car.makeType,
                car.name,
                deletedController.name,
            );

            if (fs.existsSync(getCompleteScriptPath)) {
                fs.rmSync(getCompleteScriptPath, { recursive: true, force: true });
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

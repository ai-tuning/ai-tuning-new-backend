import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSolutionDto } from './dto/create-solution.dto';
import { UpdateSolutionDto } from './dto/update-solution.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { Solution } from './schema/solution.schema';
import { Connection, Model, Types } from 'mongoose';
import * as path from 'path';
import { PricingService } from '../pricing/pricing.service';

@Injectable()
export class SolutionService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(collectionsName.solution) private readonly solutionModel: Model<Solution>,
    private readonly pricingService: PricingService,
  ) {}

  // async onModuleInit() {
  //   const solutions = require(path.join(process.cwd(), 'solutions.json'));
  //   console.log(solutions);
  //   const solutionPayload = [];
  //   for (const solution of solutions) {
  //     let category = solution.category;
  //     if (solution.category === 'Miscle') {
  //       category = 'SPECIAL';
  //     }
  //     solutionPayload.push({
  //       name: solution.solutionname,
  //       category: category.toUpperCase(),
  //       fuelTypes: solution.fuelOptions.toUpperCase().split(','),
  //     });
  //     console.log(solutionPayload);
  //   }
  //   await this.solutionModel.insertMany(solutionPayload);
  // }

  async create(createSolutionDto: CreateSolutionDto) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const isExist = await this.solutionModel.findOne({ name: createSolutionDto.name });
      if (isExist) {
        throw new BadRequestException('Solution already exist');
      }
      const solution = new this.solutionModel(createSolutionDto);
      const newSolution = await solution.save({ session });

      await this.pricingService.pushSolutionBasedItemsBySolutionId(newSolution._id as Types.ObjectId, session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  findAll() {
    return this.solutionModel.find().lean<Solution[]>();
  }

  findByIdsAndDistinctName(solutions: Types.ObjectId[]) {
    return this.solutionModel
      .find({ _id: { $in: solutions } })
      .distinct('name')
      .lean<string[]>();
  }

  async update(id: Types.ObjectId, updateSolutionDto: UpdateSolutionDto) {
    const isExist = await this.solutionModel.findOne({
      name: updateSolutionDto.name,
      _id: { $ne: id },
    });
    if (isExist) {
      throw new BadRequestException('Solution already exist');
    }

    return this.solutionModel
      .findOneAndUpdate({ _id: id }, { $set: updateSolutionDto }, { new: true })
      .lean<Solution>();
  }

  async remove(id: Types.ObjectId) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      await this.solutionModel.findByIdAndDelete({ _id: id }, { session });
      await this.pricingService.pullSolutionBasedItemsBySolutionId(id, session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

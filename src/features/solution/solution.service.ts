import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSolutionDto } from './dto/create-solution.dto';
import { UpdateSolutionDto } from './dto/update-solution.dto';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { Solution } from './schema/solution.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class SolutionService {
  constructor(@InjectModel(collectionsName.solution) private readonly solutionModel: Model<Solution>) {}

  async create(createSolutionDto: CreateSolutionDto) {
    const isExist = await this.solutionModel.findOne({ name: createSolutionDto.name, admin: createSolutionDto.admin });
    if (isExist) {
      throw new BadRequestException('Solution already exist');
    }
    const solution = new this.solutionModel(createSolutionDto);
    return solution.save();
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
      admin: updateSolutionDto.admin,
    });
    if (isExist) {
      throw new BadRequestException('Solution already exist');
    }

    return this.solutionModel
      .findOneAndUpdate({ _id: id }, { $set: updateSolutionDto }, { new: true })
      .lean<Solution>();
  }

  remove(id: Types.ObjectId) {
    return this.solutionModel.findByIdAndDelete({ _id: id });
  }
}

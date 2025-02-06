import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { SolutionInformation } from './schema/solution-information.schema';
import { Model, Types } from 'mongoose';
import { SolutionInformationDto } from './dto/solutionInformation.dto';

@Injectable()
export class SolutionInformationService {
  constructor(
    @InjectModel(collectionsName.solutionInformation)
    private readonly solutionInformationModel: Model<SolutionInformation>,
  ) {}

  async upsertData(controllerId: Types.ObjectId, createSolutionInformationDto: SolutionInformationDto) {
    await this.solutionInformationModel.deleteMany({
      admin: createSolutionInformationDto.solutionInformation[0].admin,
      controller: controllerId,
    });
    const data = await this.solutionInformationModel.insertMany(createSolutionInformationDto.solutionInformation);
    return data;
  }

  async getSolutionInformation(adminId: Types.ObjectId, controllerId: Types.ObjectId) {
    const solutionInformation = await this.solutionInformationModel.find({
      admin: adminId,
      controller: controllerId,
    });
    return solutionInformation;
  }
}

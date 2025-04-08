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

    async getSolutionInformation(controllerId: Types.ObjectId) {
        const solutionInformation = await this.solutionInformationModel.find({
            controller: controllerId,
        });
        return solutionInformation;
    }

    async getSolutionInformationByProperty(
        controllerId: Types.ObjectId,
        solutionsIds: Types.ObjectId[],
    ): Promise<(SolutionInformation & { solution: { name: string; _id: Types.ObjectId; aliasName: string } })[]> {
        const solutionInformation = await this.solutionInformationModel
            .find({
                controller: controllerId,
                solution: { $in: solutionsIds },
            })
            .populate({ path: 'solution', select: 'name aliasName' });
        return solutionInformation as any;
    }
}

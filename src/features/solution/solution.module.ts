import { Module } from '@nestjs/common';
import { SolutionService } from './solution.service';
import { SolutionController } from './solution.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { SolutionSchema } from './schema/solution.schema';
import { SolutionInformationService } from './solution-information.service';
import { SolutionInformationSchema } from './schema/solution-information.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: collectionsName.solution, schema: SolutionSchema },
      {
        name: collectionsName.solutionInformation,
        schema: SolutionInformationSchema,
      },
    ]),
  ],
  controllers: [SolutionController],
  providers: [SolutionService, SolutionInformationService],
})
export class SolutionModule {}

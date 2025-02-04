import { Module } from '@nestjs/common';
import { SolutionService } from './solution.service';
import { SolutionController } from './solution.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { SolutionSchema } from './schema/solution.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: collectionsName.solution, schema: SolutionSchema }])],
  controllers: [SolutionController],
  providers: [SolutionService],
})
export class SolutionModule {}

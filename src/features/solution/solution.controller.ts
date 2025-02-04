import { Types } from 'mongoose';
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SolutionService } from './solution.service';
import { CreateSolutionDto } from './dto/create-solution.dto';
import { UpdateSolutionDto } from './dto/update-solution.dto';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';

@Controller('solutions')
export class SolutionController {
  constructor(private readonly solutionService: SolutionService) {}

  @Post()
  async create(@Body() createSolutionDto: CreateSolutionDto) {
    const data = await this.solutionService.create(createSolutionDto);
    return { message: 'Solution created successfully', data };
  }

  @Get()
  findByAdmin(@AuthUser() authUser: IAuthUser) {
    return this.solutionService.findByAdmin(authUser.admin);
  }

  @Patch(':id')
  async update(@Param('id') id: Types.ObjectId, @Body() updateSolutionDto: UpdateSolutionDto) {
    const data = await this.solutionService.update(id, updateSolutionDto);
    return { data, message: 'Solution updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id') id: Types.ObjectId) {
    const data = await this.solutionService.remove(id);
    return { data, message: 'Solution deleted successfully' };
  }
}

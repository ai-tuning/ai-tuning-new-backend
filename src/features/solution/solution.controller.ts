import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SolutionService } from './solution.service';
import { CreateSolutionDto } from './dto/create-solution.dto';
import { UpdateSolutionDto } from './dto/update-solution.dto';

@Controller('solution')
export class SolutionController {
  constructor(private readonly solutionService: SolutionService) {}

  @Post()
  create(@Body() createSolutionDto: CreateSolutionDto) {
    return this.solutionService.create(createSolutionDto);
  }

  @Get()
  findAll() {
    return this.solutionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.solutionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSolutionDto: UpdateSolutionDto) {
    return this.solutionService.update(+id, updateSolutionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.solutionService.remove(+id);
  }
}

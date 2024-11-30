import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CarControllerService } from './car-controller.service';
import { CreateCarControllerDto } from './dto/create-car-controller.dto';
import { UpdateCarControllerDto } from './dto/update-car-controller.dto';

@Controller('car-controller')
export class CarControllerController {
  constructor(private readonly carControllerService: CarControllerService) {}

  @Post()
  create(@Body() createCarControllerDto: CreateCarControllerDto) {
    return this.carControllerService.create(createCarControllerDto);
  }

  @Get()
  findAll() {
    return this.carControllerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carControllerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCarControllerDto: UpdateCarControllerDto) {
    return this.carControllerService.update(+id, updateCarControllerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carControllerService.remove(+id);
  }
}

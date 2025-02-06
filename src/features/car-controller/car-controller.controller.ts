import { Types } from 'mongoose';
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CarControllerService } from './car-controller.service';
import { CreateCarControllerDto } from './dto/create-car-controller.dto';
import { UpdateCarControllerDto } from './dto/update-car-controller.dto';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';

@Controller('controllers')
export class CarControllerController {
  constructor(private readonly carControllerService: CarControllerService) {}

  @Post()
  async create(@Body() createCarController: CreateCarControllerDto) {
    const data = await this.carControllerService.create(createCarController);
    return { data, message: 'Car created successfully' };
  }

  @Get()
  findByAdmin(@AuthUser() authUser: IAuthUser) {
    return this.carControllerService.findByAdmin(authUser.admin);
  }

  @Patch(':id')
  async update(@Param('id') id: Types.ObjectId, @Body() updateCarDto: UpdateCarControllerDto) {
    const data = await this.carControllerService.update(id, updateCarDto);
    return { data, message: 'Car updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id') id: Types.ObjectId) {
    const data = await this.carControllerService.remove(id);
    return { data, message: 'Car deleted successfully' };
  }
}

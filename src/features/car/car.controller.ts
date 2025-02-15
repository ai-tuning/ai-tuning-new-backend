import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Put, UploadedFile } from '@nestjs/common';
import { CarService } from './car.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';
import { Types } from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('cars')
export class CarController {
  constructor(private readonly carService: CarService) {}

  @Post()
  async create(@Body() createCarDto: CreateCarDto) {
    const data = await this.carService.create(createCarDto);
    return { message: 'Car created successfully', data };
  }

  @Get()
  findByAdmin(@AuthUser() authUser: IAuthUser) {
    return this.carService.findByAdmin(authUser.admin);
  }

  @Patch(':id')
  async update(@Param('id') id: Types.ObjectId, @Body() updateCarDto: UpdateCarDto) {
    const data = await this.carService.update(id, updateCarDto);
    return { data, message: 'Car updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id') id: Types.ObjectId) {
    const data = await this.carService.remove(id);
    return { data, message: 'Car deleted successfully' };
  }

  @UseInterceptors(FileInterceptor('logo'))
  @Put('upload-logo/:id')
  async uploadLogo(@Param('id') id: Types.ObjectId, @UploadedFile() file: Express.Multer.File) {
    const data = await this.carService.uploadLogo(id, file);
    return { data, message: 'Logo uploaded successfully' };
  }
}

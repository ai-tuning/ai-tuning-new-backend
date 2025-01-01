import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminService } from './admin.service';
import { Public } from '../common';

@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post()
  async create(@Body() createAdminDto: CreateAdminDto) {
    const admin = await this.adminService.create(createAdminDto);
    return { message: 'Admin created successfully', data: admin };
  }

  @Get()
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: Types.ObjectId) {
    return this.adminService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: Types.ObjectId, @Body() updateAdminDto: UpdateAdminDto) {
    const updatedAdmin = await this.adminService.update(id, updateAdminDto);
    return { message: 'Admin updated successfully', data: updatedAdmin };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}

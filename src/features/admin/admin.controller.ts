import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminService } from './admin.service';
import { AccessRole, Public } from '../common';
import { RolesEnum } from '../constant';

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

  /**
   * For customer
   * @param id
   * @returns
   */
  @AccessRole([RolesEnum.CUSTOMER])
  @Get('details/:adminId')
  getAdminDetails(@Param('adminId') id: Types.ObjectId) {
    return this.adminService.getAdminDetails(id);
  }

  @Patch(':id')
  async update(@Param('id') id: Types.ObjectId, @Body() updateAdminDto: UpdateAdminDto) {
    const updatedAdmin = await this.adminService.update(id, updateAdminDto);
    return { message: 'Admin updated successfully', data: updatedAdmin };
  }

  @Get('ai-assist/:adminId')
  async getAiAssistStatus(@Param('adminId') adminId: Types.ObjectId) {
    const aiAssist = await this.adminService.getAiAssistStatus(adminId);
    return aiAssist;
  }

  @AccessRole([RolesEnum.ADMIN, RolesEnum.SUPER_ADMIN])
  @Patch('ai-assist/:adminId')
  async updateAiAssist(@Param('adminId') adminId: Types.ObjectId, @Body() body: { aiAssist: boolean }) {
    const aiAssist = await this.adminService.updateAiAssist(adminId, body.aiAssist);
    return { message: 'Ai assist updated successfully', data: aiAssist };
  }
}

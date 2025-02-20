import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { AccessRole, IAuthUser } from '../common';
import { RolesEnum } from '../constant';
import { CreateAdminDto } from '../admin/dto/create-admin.dto';
import { UpdateAdminDto } from '../admin/dto/update-admin.dto';
import { Types } from 'mongoose';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @AccessRole([RolesEnum.SUPER_ADMIN])
  @Get('admins')
  async getAdmins(@AuthUser() authUser: IAuthUser) {
    return this.superAdminService.getAdmins(authUser.admin);
  }

  @AccessRole([RolesEnum.SUPER_ADMIN])
  @Post('admins')
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    const data = await this.superAdminService.createAdmin(createAdminDto);
    return { message: 'Admin created successfully', data };
  }

  @AccessRole([RolesEnum.SUPER_ADMIN])
  @Patch('admins/:adminId')
  async updateAdmin(@Param('adminId') adminId: Types.ObjectId, @Body() updateAdminDto: UpdateAdminDto) {
    const data = await this.superAdminService.updateAdmin(adminId, updateAdminDto);
    return { message: 'Admin updated successfully', data };
  }
}

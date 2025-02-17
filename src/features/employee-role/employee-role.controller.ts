import { Types } from 'mongoose';
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmployeeRoleService } from './employee-role.service';
import { CreateEmployeeRoleDto } from './dto/create-employee-role.dto';
import { UpdateEmployeeRoleDto } from './dto/update-employee-role.dto';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';

@Controller('employee-role')
export class EmployeeRoleController {
  constructor(private readonly employeeRoleService: EmployeeRoleService) {}

  @Post()
  async create(@Body() createEmployeeRoleDto: CreateEmployeeRoleDto) {
    const data = await this.employeeRoleService.create(createEmployeeRoleDto);
    return { data, message: 'Employee role created successfully' };
  }

  @Get()
  findAll(@AuthUser() authUser: IAuthUser) {
    return this.employeeRoleService.findAll(authUser.admin);
  }

  @Get(':id')
  findById(@Param('id') id: Types.ObjectId) {
    return this.employeeRoleService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: Types.ObjectId, @Body() updateEmployeeRoleDto: UpdateEmployeeRoleDto) {
    const data = await this.employeeRoleService.update(id, updateEmployeeRoleDto);
    return { data, message: 'Employee role updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id') id: Types.ObjectId) {
    const data = await this.employeeRoleService.remove(id);
    return { data, message: 'Employee role deleted successfully' };
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';
import { Types } from 'mongoose';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  async create(@Body() createEmployeeDto: CreateEmployeeDto, @AuthUser() authUser: IAuthUser) {
    const data = await this.employeeService.create(createEmployeeDto, authUser);
    return { data, message: 'User created successfully' };
  }

  @Get()
  findByAdmin(@AuthUser() authUser: IAuthUser) {
    return this.employeeService.findByAdmin(authUser.admin);
  }

  @Get(':id')
  findOne(@Param('id') id: Types.ObjectId) {
    return this.employeeService.findByAdmin(id);
  }

  @Patch(':id')
  async update(@Param('id') id: Types.ObjectId, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    const data = await this.employeeService.update(id, updateEmployeeDto);
    return { data, message: 'User updated successfully' };
  }
}

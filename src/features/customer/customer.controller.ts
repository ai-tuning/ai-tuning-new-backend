import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Types } from 'mongoose';
import { CreateCustomerTypeDto } from './dto/create-customer-type.dto';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Get(':adminId')
  findAll(@Param('adminId') adminId: Types.ObjectId) {
    return this.customerService.findCustomersByAdmin(adminId);
  }

  @Get(':id')
  findOne(@Param('id') id: Types.ObjectId) {
    return this.customerService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: Types.ObjectId, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customerService.remove(+id);
  }

  @Post('customer-type')
  async createCustomerType(@Body() createCustomerTypeDto: CreateCustomerTypeDto) {
    const data = await this.customerService.createCustomerType(createCustomerTypeDto);
    return { message: 'Customer type created successfully', data };
  }
}

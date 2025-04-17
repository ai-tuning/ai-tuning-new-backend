import { Types } from 'mongoose';
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerTypeDto } from './dto/customer-type.dto';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';

@Controller('customers')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) {}

    @Post()
    create(@Body() createCustomerDto: CreateCustomerDto) {
        return this.customerService.create(createCustomerDto);
    }

    @Get('admin')
    findAll(@AuthUser() authUser: IAuthUser) {
        return this.customerService.findCustomersByAdmin(authUser.admin);
    }

    @Patch(':id')
    async update(@Param('id') id: Types.ObjectId, @Body() updateCustomerDto: UpdateCustomerDto) {
        const data = await this.customerService.update(id, updateCustomerDto);
        return { message: 'Customer updated successfully', data };
    }

    @Delete(':customerId')
    async deleteCustomer(@Param('customerId') customerId: string) {
        const data = await this.customerService.deleteCustomer(new Types.ObjectId(customerId));
        return { data, message: 'Customer deleted successfully' };
    }

    @Get('types')
    async getCustomerType(@AuthUser() authUser: IAuthUser) {
        return this.customerService.getCustomerTypes(authUser);
    }

    @Post('types')
    async createCustomerType(@Body() createCustomerTypeDto: CustomerTypeDto) {
        const data = await this.customerService.createCustomerType(createCustomerTypeDto);
        return { message: 'Customer type created successfully', data };
    }

    @Patch('types/:id')
    async updateCustomerType(@Param('id') id: Types.ObjectId, @Body() createCustomerTypeDto: CustomerTypeDto) {
        const data = await this.customerService.updateCustomerType(id, createCustomerTypeDto);
        return { message: 'Customer type created successfully', data };
    }

    @Delete('types/:id')
    async deleteCustomerType(@Param('id') id: Types.ObjectId, @AuthUser() authUser: IAuthUser) {
        const data = await this.customerService.deleteCustomerType(id, authUser.admin);
        return { message: 'Customer type created successfully', data };
    }
}

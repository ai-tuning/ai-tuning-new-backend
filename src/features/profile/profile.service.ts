import { Injectable } from '@nestjs/common';
import { IAuthUser } from '../common';
import { CustomerService } from '../customer/customer.service';
import { Customer } from '../customer/schema/customer.schema';
import { Employee } from '../employee/entities/employee.entity';
import { Admin } from '../admin/schema/admin.schema';
import { RolesEnum } from '../constant';
import { AdminService } from '../admin/admin.service';
import { UpdateCustomerDto } from '../customer/dto/update-customer.dto';
import { UpdateAdminDto } from '../admin/dto/update-admin.dto';
import { UpdateEmployeeDto } from '../employee/dto/update-employee.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly customerService: CustomerService,
    private readonly adminService: AdminService,
  ) {}

  async getProfile(authUser: IAuthUser) {
    let profile: Customer | Employee | Admin;
    if (authUser.role === RolesEnum.CUSTOMER) {
      const customer = await this.customerService.findByUserId(authUser._id);
      profile = { ...customer, ...authUser };
    } else if (authUser.role === RolesEnum.EMPLOYEE) {
      profile = { ...authUser };
    } else if (authUser.role === RolesEnum.ADMIN) {
      const admin = await this.adminService.findByUserId(authUser._id);
      console.log('admin', admin);
      profile = { ...authUser, ...admin };
    } else if (authUser.role === RolesEnum.SUPER_ADMIN) {
      profile = { ...authUser };
    }
    return profile;
  }

  async updateProfile(authUser: IAuthUser, updateProfileDto: UpdateCustomerDto | UpdateAdminDto | UpdateEmployeeDto) {
    // const profile=this.getProfile(authUser);
    let profile: Customer | Employee | Admin;
    if (authUser.role === RolesEnum.CUSTOMER) {
      profile = await this.customerService.update(authUser.customer, updateProfileDto);
    } else if (authUser.role === RolesEnum.EMPLOYEE) {
      profile = await this.customerService.update(authUser.employee, updateProfileDto);
    } else if (authUser.role === RolesEnum.ADMIN) {
      profile = await this.adminService.update(authUser.admin, updateProfileDto);
    }
    return profile;
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}

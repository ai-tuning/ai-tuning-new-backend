import { Injectable } from '@nestjs/common';
import { IAuthUser } from '../common';
import { CustomerService } from '../customer/customer.service';
import { Customer } from '../customer/schema/customer.schema';
import { Employee } from '../employee/entities/employee.entity';
import { Admin } from '../admin/schema/admin.schema';
import { RolesEnum } from '../constant';

@Injectable()
export class ProfileService {
  constructor(private readonly customerService: CustomerService) {}

  async getProfile(authUser: IAuthUser) {
    let profile: Customer | Employee | Admin;
    if (authUser.role === RolesEnum.CUSTOMER) {
      const customer = await this.customerService.findByUserId(authUser._id);
      profile = { ...customer, ...authUser };
    } else if (authUser.role === RolesEnum.EMPLOYEE) {
      profile = { ...authUser };
    } else if (authUser.role === RolesEnum.ADMIN) {
      profile = { ...authUser };
    } else if (authUser.role === RolesEnum.SUPER_ADMIN) {
      profile = { ...authUser };
    }
    return profile;
  }

  findOne(id: number) {
    return `This action returns a #${id} profile`;
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { IAuthUser } from '../common';
import { CustomerService } from '../customer/customer.service';
import * as fs from 'fs';
import * as path from 'path';
import { RolesEnum } from '../constant';
import { AdminService } from '../admin/admin.service';
import { UpdateCustomerDto } from '../customer/dto/update-customer.dto';
import { UpdateAdminDto } from '../admin/dto/update-admin.dto';
import { UpdateEmployeeDto } from '../employee/dto/update-employee.dto';
import { EmployeeService } from '../employee/employee.service';
import { EmployeeRoleService } from '../employee-role/employee-role.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly customerService: CustomerService,
    private readonly adminService: AdminService,
    private readonly employeeService: EmployeeService,
    private readonly employeeRoleService: EmployeeRoleService,
  ) {}

  async getProfile(authUser: IAuthUser) {
    delete authUser.ipAddress;
    if (authUser.role === RolesEnum.CUSTOMER) {
      const customer = await this.customerService.findByUserId(authUser._id);
      return { ...customer, customer: authUser.customer, ...authUser };
    } else if (authUser.role === RolesEnum.EMPLOYEE) {
      const employee = await this.employeeService.findByUserId(authUser._id);
      const role = await this.employeeRoleService.findById(employee.role);
      return { ...employee, permission: role.permission, ...authUser };
    } else if (authUser.role === RolesEnum.ADMIN || authUser.role === RolesEnum.SUPER_ADMIN) {
      const admin = await this.adminService.findByUserId(authUser._id);
      return { ...authUser, ...admin };
    }
  }

  async updateCustomerProfile(authUser: IAuthUser, updateProfileDto: UpdateCustomerDto) {
    await this.customerService.update(authUser.customer, updateProfileDto);
    return await this.getProfile(authUser);
  }

  async updateAdminProfile(authUser: IAuthUser, updateProfileDto: UpdateAdminDto | UpdateEmployeeDto) {
    if (authUser.role === RolesEnum.EMPLOYEE) {
      await this.customerService.update(authUser.employee, updateProfileDto);
    } else if (authUser.role === RolesEnum.ADMIN || authUser.role === RolesEnum.SUPER_ADMIN) {
      await this.adminService.update(authUser.admin, updateProfileDto);
    }
    return await this.getProfile(authUser);
  }

  async changeAvatar(authUser: IAuthUser, file: Express.Multer.File) {
    let profile: any;
    if (!file) throw new NotFoundException('File not found');

    //update the profile based on role
    if (authUser.role === RolesEnum.CUSTOMER) {
      profile = await this.customerService.changeAvatar(authUser.customer, file.filename);
    } else if (authUser.role === RolesEnum.EMPLOYEE) {
      profile = await this.employeeService.changeAvatar(authUser.employee, file.filename);
    } else if (authUser.role === RolesEnum.ADMIN || authUser.role === RolesEnum.SUPER_ADMIN) {
      profile = await this.adminService.changeAvatar(authUser.admin, file.filename);
    }

    if (profile.avatar) {
      //delete the old avatar
      const imagePath = path.join(process.cwd(), 'public', 'uploads', 'images', profile.avatar);
      if (fs.existsSync(imagePath)) fs.rmSync(imagePath);
    }

    profile.avatar = file.filename;
    return profile;
  }
  async changeLogo(authUser: IAuthUser, file: Express.Multer.File) {
    if (!file) throw new NotFoundException('File not found');

    //update the profile based on role
    const profile = await this.adminService.changeLogo(authUser.admin, file.filename);

    if (profile.logo) {
      //delete the old avatar
      const imagePath = path.join(process.cwd(), 'public', 'uploads', 'images', profile.logo);
      if (fs.existsSync(imagePath)) fs.rmSync(imagePath);
    }

    profile.logo = file.filename;
    return profile;
  }
}

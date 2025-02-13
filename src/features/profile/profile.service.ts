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

@Injectable()
export class ProfileService {
  constructor(
    private readonly customerService: CustomerService,
    private readonly adminService: AdminService,
    private readonly employeeService: EmployeeService,
  ) {}

  async getProfile(authUser: IAuthUser) {
    if (authUser.role === RolesEnum.CUSTOMER) {
      const customer = await this.customerService.findByUserId(authUser._id);
      delete authUser.ipAddress;

      return { ...customer, customer: authUser.customer, ...authUser };
    } else if (authUser.role === RolesEnum.EMPLOYEE) {
      return { ...authUser };
    } else if (authUser.role === RolesEnum.ADMIN) {
      const admin = await this.adminService.findByUserId(authUser._id);
      return { ...authUser, ...admin };
    } else if (authUser.role === RolesEnum.SUPER_ADMIN) {
      return { ...authUser };
    }
  }

  async updateProfile(authUser: IAuthUser, updateProfileDto: UpdateCustomerDto | UpdateAdminDto | UpdateEmployeeDto) {
    if (authUser.role === RolesEnum.CUSTOMER) {
      return await this.customerService.update(authUser.customer, updateProfileDto);
    } else if (authUser.role === RolesEnum.EMPLOYEE) {
      return await this.customerService.update(authUser.employee, updateProfileDto);
    } else if (authUser.role === RolesEnum.ADMIN) {
      return await this.adminService.update(authUser.admin, updateProfileDto);
    }
  }
  async changeAvatar(authUser: IAuthUser, file: Express.Multer.File) {
    let profile: any;

    //get the new avatar data
    const newAvatar = {
      fileType: file.mimetype,
      originalname: file.originalname,
      filename: file.filename,
    };

    //update the profile based on role
    if (authUser.role === RolesEnum.CUSTOMER) {
      const customer = await this.customerService.findById(authUser.customer);
      if (!customer) throw new NotFoundException('Customer not found');
      profile = await this.customerService.changeAvatar(authUser.customer, newAvatar);
    } else if (authUser.role === RolesEnum.EMPLOYEE) {
      profile = await this.employeeService.changeAvatar(authUser.employee, newAvatar);
    } else if (authUser.role === RolesEnum.ADMIN) {
      profile = await this.adminService.changeAvatar(authUser.admin, newAvatar);
    }

    const oldAvatar = profile.avatar;
    if (oldAvatar) {
      //delete the old avatar
      const imagePath = path.join(process.cwd(), 'public', 'uploads', 'images', oldAvatar.filename);
      if (fs.existsSync(imagePath)) fs.rmSync(imagePath);
    }

    profile.avatar = newAvatar;
    return profile;
  }
}

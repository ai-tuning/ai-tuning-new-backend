import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { collectionsName } from '../constant';
import { Admin } from '../admin/schema/admin.schema';
import { AdminService } from '../admin/admin.service';
import { CreateAdminDto } from '../admin/dto/create-admin.dto';
import { UpdateAdminDto } from '../admin/dto/update-admin.dto';
import { Types } from 'mongoose';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectModel(collectionsName.admin) private readonly adminModel: Model<Admin>,
    private readonly adminService: AdminService,
  ) {}

  async getAdmins(excludeId: Types.ObjectId) {
    return await this.adminModel.find({ _id: { $ne: excludeId } }).lean<Admin[]>();
  }

  async createAdmin(createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  async updateAdmin(adminId: Types.ObjectId, updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(adminId, updateAdminDto);
  }
}

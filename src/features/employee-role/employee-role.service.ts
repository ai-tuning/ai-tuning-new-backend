import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEmployeeRoleDto } from './dto/create-employee-role.dto';
import { UpdateEmployeeRoleDto } from './dto/update-employee-role.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { EmployeeRole } from './schema/employee-role.schema';
import { Connection, Model, Types } from 'mongoose';
import { Permission } from './schema/permission.schema';
import { Employee } from '../employee/schema/employee.schema';

@Injectable()
export class EmployeeRoleService {
  constructor(
    @InjectModel(collectionsName.employeeRole) private readonly employeeRoleModel: Model<EmployeeRole>,
    @InjectModel(collectionsName.permission) private readonly permissionModel: Model<Permission>,
    @InjectModel(collectionsName.employee) private readonly employeeModel: Model<Employee>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(createEmployeeRoleDto: CreateEmployeeRoleDto) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const { permission, ...roleData } = createEmployeeRoleDto;
      permission.admin = roleData.admin;

      const newPermission = new this.permissionModel(permission);
      const newRole = new this.employeeRoleModel({
        ...roleData,
        permission: newPermission._id as Types.ObjectId,
      });

      await newPermission.save({ session });
      await newRole.save({ session });

      await session.commitTransaction();

      return this.employeeRoleModel.findById(newRole._id).populate(collectionsName.permission);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  findAll(adminId: Types.ObjectId) {
    return this.employeeRoleModel.find({ admin: adminId }).populate(collectionsName.permission);
  }

  findById(roleId: Types.ObjectId) {
    return this.employeeRoleModel.findById(roleId).populate('permission');
  }

  async update(id: Types.ObjectId, updateEmployeeRoleDto: UpdateEmployeeRoleDto) {
    const { permission, ...rest } = updateEmployeeRoleDto;
    const roleData = await this.employeeRoleModel.findOneAndUpdate({ _id: id }, { $set: rest });
    const permissionData = await this.permissionModel.findByIdAndUpdate(permission._id, {
      $set: permission,
    });

    if (!roleData || !permissionData) throw new BadRequestException('Role not found');

    return this.employeeRoleModel.findById(id).populate(collectionsName.permission);
  }

  async remove(id: Types.ObjectId) {
    //check if role is assigned to any employee
    const employee = await this.employeeModel.exists({ role: id }).lean<Employee>();
    if (employee) throw new BadRequestException('Role is assigned to employee');
    return this.employeeRoleModel.findByIdAndDelete(id);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CustomValidationPipe } from '../common/validation-helper/custom-validation-pipe';
import { Connection, Model, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { collectionsName, RolesEnum } from '../constant';
import { Employee, EmployeeDocument } from './schema/employee.schema';
import { AvatarDto } from '../customer/dto/avatar.dto';
import { UserService } from '../user/user.service';
import { IAuthUser } from '../common';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(collectionsName.employee) private readonly employeeModel: Model<Employee>,
    @InjectConnection() private readonly connection: Connection,
    private readonly userService: UserService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto, authUser: IAuthUser) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const { password, ...rest } = createEmployeeDto;

      const employee = new this.employeeModel(rest);

      delete employee.parentRole;

      if (authUser.role !== RolesEnum.EMPLOYEE) {
        employee.parentRole = authUser.role;
      } else {
        const getAuthEmployeeData = await this.employeeModel
          .findById(authUser.employee)
          .select('parentRole')
          .lean<Employee>();
        employee.parentRole = getAuthEmployeeData.parentRole;
      }

      const user = await this.userService.create(
        {
          email: createEmployeeDto.email,
          password: password,
          role: RolesEnum.EMPLOYEE,
          employee: employee._id as Types.ObjectId,
          firstName: createEmployeeDto.firstName,
          lastName: createEmployeeDto.lastName,
          admin: createEmployeeDto.admin,
        },
        session,
      );
      employee.user = user._id as Types.ObjectId;
      await employee.save({ session });
      await session.commitTransaction();
      return employee;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findByAdmin(adminId: Types.ObjectId) {
    return this.employeeModel.find({ admin: adminId }).lean<Employee[]>();
  }

  async findById(id: Types.ObjectId) {
    return this.employeeModel.findById(id).lean<Employee>();
  }

  async findByUserId(id: Types.ObjectId) {
    return this.employeeModel.findOne({ user: id }).lean<Employee>();
  }

  async update(id: Types.ObjectId, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const employee = await this.employeeModel.findById(id).lean();
      if (!employee) throw new NotFoundException('User not found');
      if (employee.email !== updateEmployeeDto.email) {
        await this.userService.updateUserEmail(employee.user, updateEmployeeDto.email, session);
      }

      if (employee.firstName !== updateEmployeeDto.firstName || employee.lastName !== updateEmployeeDto.lastName) {
        await this.userService.updateName(
          employee.user,
          { firstName: updateEmployeeDto.firstName, lastName: updateEmployeeDto.lastName },
          session,
        );
      }

      const updatedEmployee = await this.employeeModel
        .findOneAndUpdate({ _id: id }, { $set: updateEmployeeDto }, { new: true, session })
        .lean<Employee>();
      await session.commitTransaction();
      return updatedEmployee;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async changeAvatar(employeeId: Types.ObjectId, avatar: string) {
    // await CustomValidationPipe([avatar], AvatarDto);

    //don't return the new document
    return this.employeeModel.findOneAndUpdate({ _id: employeeId }, { $set: { avatar } }).lean<EmployeeDocument>();
  }

  async deleteEmployee(id: Types.ObjectId) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const deletedEmployee = await this.employeeModel.findByIdAndDelete(id, { session }).lean<EmployeeDocument>();
      await this.userService.deleteUser(deletedEmployee.user, session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

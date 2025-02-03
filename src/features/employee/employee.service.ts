import { Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CustomValidationPipe } from '../common/validation-helper/custom-validation-pipe';
import { Model, Types } from 'mongoose';
import { FileDto } from '../common';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { Employee, EmployeeDocument } from './entities/employee.entity';

@Injectable()
export class EmployeeService {
  constructor(@InjectModel(collectionsName.employee) private readonly employeeModel: Model<Employee>) {}

  create(createEmployeeDto: CreateEmployeeDto) {
    return 'This action adds a new employee';
  }

  findAll() {
    return `This action returns all employee`;
  }

  findOne(id: number) {
    return `This action returns a #${id} employee`;
  }

  update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    return `This action updates a #${id} employee`;
  }

  async changeAvatar(employeeId: Types.ObjectId, avatar: FileDto) {
    await CustomValidationPipe([avatar], FileDto);

    //don't return the new document
    return this.employeeModel.findOneAndUpdate({ _id: employeeId }, { $set: { avatar } }).lean<EmployeeDocument>();
  }
}

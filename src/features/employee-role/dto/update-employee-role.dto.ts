import { PartialType } from '@nestjs/swagger';
import { CreateEmployeeRoleDto } from './create-employee-role.dto';
import { Types } from 'mongoose';

export class UpdateEmployeeRoleDto extends PartialType(CreateEmployeeRoleDto) {
  _id: Types.ObjectId;
}

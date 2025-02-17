import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';

export class Permission {
  _id: Types.ObjectId;

  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsBoolean()
  dashboard: boolean;

  @IsNotEmpty()
  @IsBoolean()
  fileServices: boolean;

  @IsNotEmpty()
  @IsBoolean()
  tickets: boolean;

  @IsNotEmpty()
  @IsBoolean()
  addSolution: boolean;

  @IsNotEmpty()
  @IsBoolean()
  solutions: boolean;

  @IsNotEmpty()
  @IsBoolean()
  scripts: boolean;

  @IsNotEmpty()
  @IsBoolean()
  customerTypes: boolean;

  @IsNotEmpty()
  @IsBoolean()
  customers: boolean;

  @IsNotEmpty()
  @IsBoolean()
  employees: boolean;

  @IsNotEmpty()
  @IsBoolean()
  roles: boolean;

  @IsNotEmpty()
  @IsBoolean()
  prices: boolean;

  @IsNotEmpty()
  @IsBoolean()
  invoices: boolean;

  @IsNotEmpty()
  @IsBoolean()
  schedule: boolean;

  @IsNotEmpty()
  @IsBoolean()
  notice: boolean;

  @IsNotEmpty()
  @IsBoolean()
  credentials: boolean;
}

export class CreateEmployeeRoleDto {
  @IsNotEmpty()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @ValidateNested()
  permission: Permission;
}

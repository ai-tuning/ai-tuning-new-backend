import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { collectionsName, RolesEnum, UserStatusEnum } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
class Employee extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: collectionsName.admin,
  })
  admin: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: collectionsName.admin,
    required: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: collectionsName.employeeRole,
    required: true,
  })
  role: Types.ObjectId;

  @Prop({
    type: String,
    enum: RolesEnum,
    required: true,
  })
  parentRole: RolesEnum;

  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String })
  avatar: string;

  @Prop({
    type: String,
    enum: UserStatusEnum,
    default: UserStatusEnum.ACTIVE,
  })
  status: UserStatusEnum;
}

const EmployeeSchema = SchemaFactory.createForClass(Employee);

class EmployeeDocument {
  _id: Types.ObjectId;
  admin: Types.ObjectId;
  user: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: {
    originalname: string;
    fileType: string;
    url: string;
  };
  status: UserStatusEnum;
}

export { EmployeeSchema, Employee, EmployeeDocument };

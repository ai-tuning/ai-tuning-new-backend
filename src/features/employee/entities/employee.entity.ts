import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { FileSchema } from 'src/features/common';
import { collectionsName, UserStatusEnum } from 'src/features/constant';

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

  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: FileSchema })
  avatar: FileSchema;

  @Prop({
    type: String,
    enum: UserStatusEnum,
    required: true,
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

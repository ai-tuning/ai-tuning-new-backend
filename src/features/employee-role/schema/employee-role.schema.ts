import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { collectionsName } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
export class EmployeeRole {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: collectionsName.admin })
  admin: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: collectionsName.permission })
  permission: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  description: string;
}

export const EmployeeRoleSchema = SchemaFactory.createForClass(EmployeeRole);

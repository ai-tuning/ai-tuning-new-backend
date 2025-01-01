import { Types } from 'mongoose';
import { RolesEnum } from 'src/features/constant';

export interface IAuthUser {
  _id: Types.ObjectId;
  admin: Types.ObjectId;
  customer: Types.ObjectId;
  employee: Types.ObjectId;
  role: RolesEnum;
  email: string;
}

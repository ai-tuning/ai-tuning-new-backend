import { Types } from 'mongoose';
import { RolesEnum } from 'src/features/constant';

export interface IAuthUser {
  _id: Types.ObjectId;
  admin: Types.ObjectId;
  role: RolesEnum;
  email: string;
}

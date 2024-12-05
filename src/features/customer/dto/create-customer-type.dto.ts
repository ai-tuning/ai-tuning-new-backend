import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

import { Types } from 'mongoose';

export class CreateCustomerTypeDto {
  @IsNotEmpty()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  name: string;
}

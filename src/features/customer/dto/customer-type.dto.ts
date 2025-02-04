import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

import { Types } from 'mongoose';

export class CustomerTypeDto {
  @IsNotEmpty()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  name: string;
}

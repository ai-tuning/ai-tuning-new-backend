import { Types } from 'mongoose';
import { IsMongoId, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class PurchaseAdminCreditDto {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

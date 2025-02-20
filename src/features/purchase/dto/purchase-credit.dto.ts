import { Types } from 'mongoose';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PurchaseCreditDto {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsOptional()
  @IsString()
  @IsMongoId()
  customer: Types.ObjectId;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

import { IsArray, IsMongoId, IsNotEmpty, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';

class EvcPricingItem {
  @IsNotEmpty()
  @IsMongoId()
  customerType: Types.ObjectId;

  @IsNotEmpty()
  @IsNumber()
  price: number;
}

export class CreditPricingDto {
  @IsNotEmpty()
  @IsNumber()
  creditPrice: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  EvcPricingItems: EvcPricingItem[];
}

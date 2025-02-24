import { IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';

class Prices {
  @IsNotEmpty()
  @IsNumber()
  deactivation: number;

  @IsNotEmpty()
  @IsNumber()
  tuning: number;

  @IsNotEmpty()
  @IsNumber()
  special: number;
}

export class AdminPricingDto {
  @IsNotEmpty()
  @IsNumber()
  creditPrice: number;

  @IsNotEmpty()
  @IsNumber()
  perFilePrice: number;

  @IsNotEmpty()
  @ValidateNested()
  car: Prices;

  @IsNotEmpty()
  @ValidateNested()
  bike: Prices;

  @IsNotEmpty()
  @ValidateNested()
  truck_agri_construction: Prices;
}

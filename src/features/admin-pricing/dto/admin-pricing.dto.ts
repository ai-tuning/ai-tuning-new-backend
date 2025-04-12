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

    @IsNotEmpty()
    @IsNumber()
    minPrice: number;

    @IsNotEmpty()
    @IsNumber()
    maxPrice: number;
}

class PricingCategory {
    @IsNotEmpty()
    @ValidateNested()
    standard: Prices;

    @IsNotEmpty()
    @ValidateNested()
    premium: Prices;

    @IsNotEmpty()
    @ValidateNested()
    platinum: Prices;
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
    car: PricingCategory;

    @IsNotEmpty()
    @ValidateNested()
    bike: PricingCategory;

    @IsNotEmpty()
    @ValidateNested()
    truck_agri_construction: PricingCategory;
}

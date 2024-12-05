import { IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PaypalCredentialDto {
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @IsNotEmpty()
  @IsString()
  clientSecret: string;
}

export class AlienTechCredentialDto {
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @IsNotEmpty()
  @IsString()
  clientSecret: string;
}

export class AutoTunerCredentialDto {
  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @IsNotEmpty()
  @IsString()
  tunerId: string;
}
export class AutoFlasherCredentialDto {
  @IsNotEmpty()
  @IsString()
  autoFlasher: string;
}

export class EvcCredentialDto {
  @IsNotEmpty()
  @IsString()
  apiId: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class CreateCredentialDto {
  @IsNotEmpty()
  @IsMongoId()
  admin: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaypalCredentialDto)
  paypal?: PaypalCredentialDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AlienTechCredentialDto)
  alienTech?: AlienTechCredentialDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvcCredentialDto)
  evc?: EvcCredentialDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AutoTunerCredentialDto)
  autoTuner?: AutoTunerCredentialDto;

  @IsOptional()
  @IsString()
  @Type(() => AutoFlasherCredentialDto)
  autoFlasher?: AutoFlasherCredentialDto;
}

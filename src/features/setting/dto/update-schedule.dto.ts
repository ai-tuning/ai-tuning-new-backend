import { IsBoolean, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';

class Timing {
  @IsNotEmpty()
  @IsString()
  from: string;

  @IsNotEmpty()
  @IsString()
  to: string;

  @IsNotEmpty()
  @IsBoolean()
  closed: string;
}

export class UpdateScheduleDto {
  @IsNotEmpty()
  @IsString()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @ValidateNested()
  sunday: Timing;

  @IsNotEmpty()
  @ValidateNested()
  monday: Timing;

  @IsNotEmpty()
  @ValidateNested()
  tuesday: Timing;

  @IsNotEmpty()
  @ValidateNested()
  wednesday: Timing;

  @IsNotEmpty()
  @ValidateNested()
  thursday: Timing;

  @IsNotEmpty()
  @ValidateNested()
  friday: Timing;

  @IsNotEmpty()
  @ValidateNested()
  saturday: Timing;
}

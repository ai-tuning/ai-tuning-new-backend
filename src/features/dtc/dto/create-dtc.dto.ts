import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateDtcDto {
    @IsNotEmpty()
    admin: Types.ObjectId;

    @IsNotEmpty()
    customer: Types.ObjectId;

    @IsNotEmpty()
    @IsString()
    faultCodes: string;
}

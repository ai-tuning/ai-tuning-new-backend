import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { SLAVE_TYPE } from 'src/features/constant';

export class DecodeDto {
    @IsNotEmpty()
    @IsMongoId()
    adminId: Types.ObjectId;

    @IsNotEmpty()
    @IsEnum(SLAVE_TYPE)
    slaveType: SLAVE_TYPE;

    @IsOptional()
    sn: string;
}

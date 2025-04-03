import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class DecryptFlexDto {
    @IsNotEmpty()
    @IsString()
    filePath: string;

    @IsNotEmpty()
    @IsString()
    adminId: Types.ObjectId;

    @IsNotEmpty()
    @IsString()
    tempFileId: Types.ObjectId;

    @IsNotEmpty()
    @IsString()
    sn: string;
}

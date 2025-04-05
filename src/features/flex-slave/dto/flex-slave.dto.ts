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
    documentId: Types.ObjectId;

    @IsNotEmpty()
    @IsString()
    uniqueId: string;

    @IsNotEmpty()
    @IsString()
    sn: string;
}

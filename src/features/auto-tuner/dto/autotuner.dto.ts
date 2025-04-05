import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class DecodeAutoTunerFileDto {
    @IsNotEmpty()
    @IsString()
    filePath: string;

    @IsNotEmpty()
    @IsString()
    adminId: Types.ObjectId;

    @IsNotEmpty()
    @IsString()
    documentId: Types.ObjectId;
}

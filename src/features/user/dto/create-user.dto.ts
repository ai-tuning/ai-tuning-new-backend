import { IsEmail, IsEnum, IsMobilePhone, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RolesEnum } from 'src/features/constant';

export class CreateUserDto {
    @IsNotEmpty({ message: "Email is required" })
    @IsEmail()
    email: string;

    @IsNotEmpty({ message: "Mobile is required" })
    @IsMobilePhone("bn-BD")
    mobile: string;

    @IsNotEmpty({ message: "Password is required" })
    @IsString()
    password: string;

    @IsOptional()
    @IsEnum(RolesEnum, { message: "Invalid Role" })
    role: RolesEnum;

    @IsOptional()
    @IsMongoId()
    admin: string;

    @IsOptional()
    @IsMongoId()
    hod: string;

    @IsOptional()
    @IsMongoId()
    employee: string;
}

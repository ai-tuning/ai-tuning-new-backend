import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AvatarDto {
  @IsNotEmpty()
  @IsString()
  originalname: string;

  @IsNotEmpty()
  @IsString()
  fileType: string;

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  filename: string;
}

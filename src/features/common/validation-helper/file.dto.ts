import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class FileDto {
  @IsNotEmpty()
  @IsString()
  originalname: string;

  @IsNotEmpty()
  @IsString()
  fileType: string;

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  url: string;
}

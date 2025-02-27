import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AvatarDto {
  @IsNotEmpty()
  @IsString()
  avatar: string;
}

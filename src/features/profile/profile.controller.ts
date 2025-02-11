import { Controller, Get, Body, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';
import { UpdateCustomerDto } from '../customer/dto/update-customer.dto';
import { UpdateAdminDto } from '../admin/dto/update-admin.dto';
import { UpdateEmployeeDto } from '../employee/dto/update-employee.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@AuthUser() authUser: IAuthUser) {
    return this.profileService.getProfile(authUser);
  }

  @Patch()
  updateProfile(
    @Body() updateProfileDto: UpdateCustomerDto | UpdateAdminDto | UpdateEmployeeDto,
    @AuthUser() authUser: IAuthUser,
  ) {
    return this.profileService.updateProfile(authUser, updateProfileDto);
  }

  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 1024 * 1024 * 1 }, //1MB
      dest: 'public/uploads/images',
    }),
  )
  @Patch('change-avatar')
  async changeAvatar(@AuthUser() authUser: IAuthUser, @UploadedFile() file: Express.Multer.File) {
    const user = await this.profileService.changeAvatar(authUser, file);
    return { data: user, message: 'Avatar Changed' };
  }
}

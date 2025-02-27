import { Controller, Get, Body, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { AccessRole, IAuthUser } from '../common';
import { UpdateCustomerDto } from '../customer/dto/update-customer.dto';
import { UpdateAdminDto } from '../admin/dto/update-admin.dto';
import { UpdateEmployeeDto } from '../employee/dto/update-employee.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesEnum } from '../constant';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@AuthUser() authUser: IAuthUser) {
    return this.profileService.getProfile(authUser);
  }

  @AccessRole([RolesEnum.ADMIN, RolesEnum.SUPER_ADMIN, RolesEnum.EMPLOYEE])
  @Patch('admin')
  updateAdminsProfile(@Body() updateProfileDto: UpdateAdminDto | UpdateEmployeeDto, @AuthUser() authUser: IAuthUser) {
    return this.profileService.updateAdminProfile(authUser, updateProfileDto);
  }

  @AccessRole([RolesEnum.CUSTOMER])
  @Patch('customer')
  updateCustomerProfile(@Body() updateProfileDto: UpdateCustomerDto, @AuthUser() authUser: IAuthUser) {
    return this.profileService.updateCustomerProfile(authUser, updateProfileDto);
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
    return { data: user, message: 'Avatar Changed Successfully' };
  }

  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 1024 * 1024 * 1 }, //1MB
      dest: 'public/uploads/images',
    }),
  )
  @AccessRole([RolesEnum.ADMIN, RolesEnum.SUPER_ADMIN])
  @Patch('change-logo')
  async changeLogo(@AuthUser() authUser: IAuthUser, @UploadedFile() file: Express.Multer.File) {
    const user = await this.profileService.changeLogo(authUser, file);
    return { data: user, message: 'Logo Changed Successfully' };
  }
}

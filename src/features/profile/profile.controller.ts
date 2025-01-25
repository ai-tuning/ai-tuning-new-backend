import { Controller, Get, Param, Delete, Body, Patch, UploadedFile } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';
import { UpdateCustomerDto } from '../customer/dto/update-customer.dto';
import { UpdateAdminDto } from '../admin/dto/update-admin.dto';
import { UpdateEmployeeDto } from '../employee/dto/update-employee.dto';

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

  // @Patch('change-avatar')
  // update(@Param('id') id: string, @Body() updateProfileDto: UpdateCustomerDto) {
  //   return this.profileService.update(+id, updateProfileDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profileService.remove(+id);
  }
}

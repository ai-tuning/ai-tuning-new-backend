import { Controller, Get, Body, Patch, Param } from '@nestjs/common';
import { AdminPricingService } from './admin-pricing.service';
import { AdminPricingDto } from './dto/admin-pricing.dto';
import { AccessRole } from '../common';
import { ADMIN_CATEGORY, RolesEnum } from '../constant';

@Controller('admin-pricing')
export class AdminPricingController {
  constructor(private readonly adminPricingService: AdminPricingService) {}

  @Get()
  async getAdminAllPricing() {
    return await this.adminPricingService.getAdminAllPricing();
  }
  @Get(':adminCategory')
  async getAdminPricing(@Param('adminCategory') adminCategory: ADMIN_CATEGORY) {
    return await this.adminPricingService.getPricingByCategory(adminCategory);
  }

  @AccessRole([RolesEnum.SUPER_ADMIN])
  @Patch('')
  async updateAdminPricing(@Body() updateAdminPricingDto: AdminPricingDto) {
    console.log(updateAdminPricingDto);
    const data = await this.adminPricingService.updateAdminPricing(updateAdminPricingDto);
    return { message: 'Admin pricing updated successfully', data };
  }
}

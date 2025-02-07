import { Controller, Get, Body, Patch, Param, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';
import { Types } from 'mongoose';
import { CAR_TYPE_ENUM } from '../constant';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('')
  async findAll(@AuthUser() authUser: IAuthUser) {
    return await this.pricingService.findByAdminId(authUser.admin);
  }

  @Patch(':adminId')
  async update(
    @Param('adminId') adminId: Types.ObjectId,
    @Body() updatePricingDto: UpdatePricingDto[],
    @Query('makeType') makeType: CAR_TYPE_ENUM,
  ) {
    const pricing = await this.pricingService.updatePricing(adminId, updatePricingDto, makeType);
    return { data: pricing, message: 'Pricing updated successfully' };
  }
}

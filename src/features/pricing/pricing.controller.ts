import { Controller, Get, Body, Patch, Param, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';
import { Types } from 'mongoose';
import { MAKE_TYPE_ENUM } from '../constant';
import { CreditPricingDto } from './dto/credit-pricing.dto';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('')
  async findPricingByAdmin(@AuthUser() authUser: IAuthUser) {
    return await this.pricingService.findByAdminId(authUser.admin);
  }

  @Get('customer-types/:customerTypeId')
  async findPricingByCustomerType(
    @AuthUser() authUser: IAuthUser,
    @Param('customerTypeId') customerTypeId: Types.ObjectId,
  ) {
    return await this.pricingService.getPricingByCustomerType(authUser.admin, customerTypeId);
  }

  @Patch(':adminId')
  async update(
    @Param('adminId') adminId: Types.ObjectId,
    @Body() updatePricingDto: UpdatePricingDto[],
    @Query('makeType') makeType: MAKE_TYPE_ENUM,
  ) {
    const pricing = await this.pricingService.updatePricing(adminId, updatePricingDto, makeType);
    return { data: pricing, message: 'Pricing updated successfully' };
  }

  @Get('credit')
  async findCreditPricingByAdmin(@AuthUser() authUser: IAuthUser) {
    return await this.pricingService.findCreditPricingByAdminId(authUser.admin);
  }

  @Patch('credit/:adminId')
  async updateCreditPricing(@Param('adminId') adminId: Types.ObjectId, @Body() updatePricingDto: CreditPricingDto) {
    const creditPricing = await this.pricingService.updateCreditPricing(adminId, updatePricingDto);
    return { data: creditPricing, message: 'Pricing updated successfully' };
  }
}

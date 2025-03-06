import { Controller, Get, Body, Patch, Param, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';
import { Types } from 'mongoose';
import { MAKE_TYPE_ENUM } from '../constant';
import { CreditPricingDto } from './dto/credit-pricing.dto';
import { PRICING_TYPE_ENUM } from '../constant/enums/pricing-type.enum';

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

  @Patch('update-pricing-type/:adminId')
  async updatePricingType(
    @Param('adminId') adminId: Types.ObjectId,
    @Body() updatePricingTypeDto: { pricingType: PRICING_TYPE_ENUM },
  ) {
    const data = await this.pricingService.updatePricingType(adminId, updatePricingTypeDto.pricingType);
    return { message: 'Pricing type updated successfully' };
  }

  @Patch('update-max-min/:adminId')
  async updateMaxMinPricing(
    @Param('adminId') adminId: Types.ObjectId,
    @Body() updateDto: { maxPrice: number; minPrice: number },
  ) {
    await this.pricingService.updateMaxAndMinPrice(adminId, updateDto.maxPrice, updateDto.minPrice);
    return { message: 'Pricing updated successfully' };
  }

  @Patch('credit/:adminId')
  async updateCreditPricing(@Param('adminId') adminId: Types.ObjectId, @Body() updatePricingDto: CreditPricingDto) {
    const creditPricing = await this.pricingService.updateCreditPricing(adminId, updatePricingDto);
    return { data: creditPricing, message: 'Pricing updated successfully' };
  }
}

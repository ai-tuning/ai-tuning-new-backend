import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ADMIN_CATEGORY, collectionsName } from '../constant';
import { AdminPricingDto } from './dto/admin-pricing.dto';
import { AdminPricing } from './schema/admin-pricing.schema';

@Injectable()
export class AdminPricingService {
  constructor(@InjectModel(collectionsName.adminPricing) private readonly adminPricingModel: Model<AdminPricing>) {}

  async getAdminAllPricing() {
    return this.adminPricingModel.findOne();
  }

  async getPricingByCategory(category: ADMIN_CATEGORY) {
    const data = await this.adminPricingModel.findOne().lean<AdminPricing>();
    return data[category.toLowerCase()];
  }

  async updateAdminPricing(updateAdminPricingDto: AdminPricingDto) {
    return await this.adminPricingModel
      .findOneAndUpdate({}, updateAdminPricingDto, { new: true, upsert: true })
      .lean<AdminPricing>();
  }
}

import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ADMIN_CATEGORY, collectionsName } from '../constant';
import { AdminPricingDto } from './dto/admin-pricing.dto';
import { AdminPricing, AdminPricingDocument } from './schema/admin-pricing.schema';

@Injectable()
export class AdminPricingService {
  constructor(@InjectModel(collectionsName.adminPricing) private readonly adminPricingModel: Model<AdminPricing>) {}

  async getAdminAllPricing() {
    return this.adminPricingModel.findOne().lean<AdminPricingDocument>();
  }

  async getPricingByCategory(category: ADMIN_CATEGORY) {
    const data = await this.adminPricingModel.findOne().lean<AdminPricingDocument>();
    const lowerCaseCategory = category.toLowerCase();
    return {
      creditPrice: data.creditPrice,
      perFilePrice: data.perFilePrice,
      car: data.car[lowerCaseCategory],
      bike: data.bike[lowerCaseCategory],
      truck_agri_construction: data.truck_agri_construction[lowerCaseCategory],
    };
  }

  async updateAdminPricing(updateAdminPricingDto: AdminPricingDto) {
    return await this.adminPricingModel
      .findOneAndUpdate({}, updateAdminPricingDto, { new: true, upsert: true })
      .lean<AdminPricingDocument>();
  }
}

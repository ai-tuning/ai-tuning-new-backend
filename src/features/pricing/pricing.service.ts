import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { InjectModel } from '@nestjs/mongoose';
import { CAR_TYPE_ENUM, collectionsName, SOLUTION_CATEGORY } from '../constant';
import { Pricing } from './schema/pricing.schema';
import { ClientSession, Model, Types } from 'mongoose';

@Injectable()
export class PricingService {
  constructor(@InjectModel(collectionsName.pricing) private readonly pricingModel: Model<Pricing>) {}

  async create(adminId: Types.ObjectId, customerType: Types.ObjectId, session: ClientSession) {
    //check if exist or not
    const exist = await this.pricingModel.exists({ admin: adminId });
    if (exist) throw new BadRequestException('Pricing already exist');

    //create pricing
    const pricing = new this.pricingModel({
      admin: adminId,
      items: [
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
          makeType: CAR_TYPE_ENUM.CAR,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
          makeType: CAR_TYPE_ENUM.BIKE,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
          makeType: CAR_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.SPECIALS,
          makeType: CAR_TYPE_ENUM.CAR,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.SPECIALS,
          makeType: CAR_TYPE_ENUM.BIKE,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.SPECIALS,
          makeType: CAR_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.TUNING,
          makeType: CAR_TYPE_ENUM.CAR,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.TUNING,
          makeType: CAR_TYPE_ENUM.BIKE,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.TUNING,
          makeType: CAR_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
        },
      ],
    });
    return pricing.save({ session });
  }

  async findByAdminId(adminId: Types.ObjectId) {
    return this.pricingModel
      .findOne({ admin: adminId })
      .populate({
        path: 'items.customerType',
        select: 'name',
        model: collectionsName.customerType,
      })
      .lean<Pricing[]>();
  }

  async pushItems(adminId: Types.ObjectId, customerType: Types.ObjectId, session: ClientSession) {
    return this.pricingModel
      .findOneAndUpdate(
        { admin: adminId },
        {
          $push: {
            items: {
              $each: [
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
                  makeType: CAR_TYPE_ENUM.CAR,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
                  makeType: CAR_TYPE_ENUM.BIKE,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
                  makeType: CAR_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.SPECIALS,
                  makeType: CAR_TYPE_ENUM.CAR,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.SPECIALS,
                  makeType: CAR_TYPE_ENUM.BIKE,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.SPECIALS,
                  makeType: CAR_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.TUNING,
                  makeType: CAR_TYPE_ENUM.CAR,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.TUNING,
                  makeType: CAR_TYPE_ENUM.BIKE,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.TUNING,
                  makeType: CAR_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
                },
              ],
            },
          },
        },
        { new: true, session },
      )
      .lean<Pricing>();
  }

  async pullItems(adminId: Types.ObjectId, customerType: Types.ObjectId, session: ClientSession) {
    return this.pricingModel
      .findOneAndUpdate({ admin: adminId }, { $pull: { 'item.customerType': customerType } }, { new: true, session })
      .lean<Pricing>();
  }

  async updatePricing(adminId: Types.ObjectId, updatePricingDto: UpdatePricingDto[], makeType: CAR_TYPE_ENUM) {
    const pricing = await this.pricingModel.findOne({ admin: adminId });

    if (!pricing) {
      throw new NotFoundException('Pricing not found');
    }

    for (const updatedItem of updatePricingDto) {
      const pricingItem = pricing.items.find(
        (item) =>
          item.makeType === makeType &&
          item.solutionCategory === updatedItem.solutionCategory &&
          item.customerType.toString() === updatedItem.customerType.toString(),
      );
      if (pricingItem) {
        pricingItem.price = updatedItem.price;
      }
    }

    return this.pricingModel.findOneAndUpdate({ admin: adminId }, pricing, { new: true });
  }
}

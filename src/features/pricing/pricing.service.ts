import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { InjectModel } from '@nestjs/mongoose';
import { MAKE_TYPE_ENUM, collectionsName, SOLUTION_CATEGORY } from '../constant';
import { Pricing } from './schema/pricing.schema';
import { ClientSession, Model, Types } from 'mongoose';
import { CreditPricing } from './schema/credit-pricing.schema';
import { CreditPricingDto } from './dto/credit-pricing.dto';

@Injectable()
export class PricingService {
  constructor(
    @InjectModel(collectionsName.pricing) private readonly pricingModel: Model<Pricing>,
    @InjectModel(collectionsName.creditPricing) private readonly creditPricingModel: Model<CreditPricing>,
  ) {}

  async create(adminId: Types.ObjectId, customerType: Types.ObjectId, session: ClientSession) {
    //check if exist or not
    const exist = await this.pricingModel.exists({ admin: adminId });
    if (exist) throw new BadRequestException('Pricing already exist');

    await this.creditPricingModel.create({
      admin: adminId,
      creditPrice: 0,
      evcPrices: [
        {
          customerType: customerType,
          price: 0,
        },
      ],
    });

    //create pricing
    const pricing = new this.pricingModel({
      admin: adminId,
      items: [
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
          makeType: MAKE_TYPE_ENUM.CAR,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
          makeType: MAKE_TYPE_ENUM.BIKE,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
          makeType: MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.SPECIALS,
          makeType: MAKE_TYPE_ENUM.CAR,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.SPECIALS,
          makeType: MAKE_TYPE_ENUM.BIKE,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.SPECIALS,
          makeType: MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.TUNING,
          makeType: MAKE_TYPE_ENUM.CAR,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.TUNING,
          makeType: MAKE_TYPE_ENUM.BIKE,
        },
        {
          customerType: customerType,
          price: 0,
          solutionCategory: SOLUTION_CATEGORY.TUNING,
          makeType: MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
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
      .lean<Pricing>();
  }

  async getPricingByCustomerType(adminId: Types.ObjectId, customerType: Types.ObjectId) {
    const pricing = await this.pricingModel.findOne({ admin: adminId }).lean<Pricing>();
    const filteredItems = pricing.items.filter((item) => item.customerType.toString() === customerType.toString());
    pricing.items = filteredItems;
    return pricing;
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
                  makeType: MAKE_TYPE_ENUM.CAR,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
                  makeType: MAKE_TYPE_ENUM.BIKE,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
                  makeType: MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.SPECIALS,
                  makeType: MAKE_TYPE_ENUM.CAR,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.SPECIALS,
                  makeType: MAKE_TYPE_ENUM.BIKE,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.SPECIALS,
                  makeType: MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.TUNING,
                  makeType: MAKE_TYPE_ENUM.CAR,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.TUNING,
                  makeType: MAKE_TYPE_ENUM.BIKE,
                },
                {
                  customerType: customerType,
                  price: 0,
                  solutionCategory: SOLUTION_CATEGORY.TUNING,
                  makeType: MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
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
    const pricing = await this.pricingModel.findOne({ admin: adminId }).session(session);
    const updatedPricingItems = pricing.items.filter((item) => {
      return item.customerType.toString() !== customerType.toString();
    });
    pricing.items = updatedPricingItems;
    return await pricing.save({ session });
  }

  async updatePricing(adminId: Types.ObjectId, updatePricingDto: UpdatePricingDto[], makeType: MAKE_TYPE_ENUM) {
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

  async findCreditPricingByAdminId(adminId: Types.ObjectId) {
    return this.creditPricingModel
      .findOne({ admin: adminId })
      .populate({
        path: 'evcPrices.customerType',
        select: 'name',
        model: collectionsName.customerType,
      })
      .lean<CreditPricing>();
  }

  async updateCreditPricing(adminId: Types.ObjectId, updatePricingDto: CreditPricingDto) {
    const pricing = await this.creditPricingModel.findOneAndUpdate(
      { admin: adminId },
      {
        $set: updatePricingDto,
      },
    );

    if (!pricing) {
      throw new NotFoundException('Pricing not found');
    }

    return pricing;
  }

  async pushEvcPriceItems(adminId: Types.ObjectId, customerType: Types.ObjectId, session: ClientSession) {
    return this.creditPricingModel
      .findOneAndUpdate(
        { admin: adminId },
        {
          $push: {
            evcPrices: {
              customerType: customerType,
              price: 0,
            },
          },
        },
        { new: true, session },
      )
      .lean<CreditPricing>();
  }

  async pullEvcPricingItem(adminId: Types.ObjectId, customerType: Types.ObjectId, session: ClientSession) {
    const pricing = await this.creditPricingModel.findOne({ admin: adminId }).session(session);
    const updatedEvcPrices = pricing.evcPrices.filter((item) => {
      return item.customerType.toString() !== customerType.toString();
    });
    pricing.evcPrices = updatedEvcPrices;
    return await pricing.save({ session });
  }
}

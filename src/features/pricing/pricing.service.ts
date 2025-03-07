import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { InjectModel } from '@nestjs/mongoose';
import { MAKE_TYPE_ENUM, collectionsName, SOLUTION_CATEGORY } from '../constant';
import { Pricing } from './schema/pricing.schema';
import { ClientSession, Model, Types } from 'mongoose';
import { CreditPricing } from './schema/credit-pricing.schema';
import { CreditPricingDto } from './dto/credit-pricing.dto';
import { Solution } from '../solution/schema/solution.schema';
import { PRICING_TYPE_ENUM } from '../constant/enums/pricing-type.enum';
import { CustomerType } from '../customer/schema/customer-type.schema';
import { UpdatePricingLimitDto } from './dto/update-pricing-limit.dto';

@Injectable()
export class PricingService {
  constructor(
    @InjectModel(collectionsName.pricing) private readonly pricingModel: Model<Pricing>,
    @InjectModel(collectionsName.creditPricing) private readonly creditPricingModel: Model<CreditPricing>,
    @InjectModel(collectionsName.solution) private readonly solutionModel: Model<Solution>,
    @InjectModel(collectionsName.customerType) private readonly customerTypeModel: Model<CustomerType>,
  ) {}

  // async onModuleInit() {
  //   const session = await this.pricingModel.startSession();
  //   session.startTransaction();
  //   try {
  //     const customerTypes = await this.customerTypeModel.find();
  //     for (const customerType of customerTypes) {
  //       await this.pushPriceLimit(customerType.admin, customerType._id as Types.ObjectId, session);
  //     }
  //     await session.commitTransaction();
  //     await session.endSession();
  //   } catch (error) {
  //     await session.abortTransaction();
  //     session.endSession();
  //   }
  // }

  async create(adminId: Types.ObjectId, customerType: Types.ObjectId, session: ClientSession) {
    //check if exist or not
    const exist = await this.pricingModel.exists({ admin: adminId });
    if (exist) throw new BadRequestException('Pricing already exist');

    await this.creditPricingModel.create(
      {
        admin: adminId,
        creditPrice: 0,
        enabledPricingType: PRICING_TYPE_ENUM.CATEGORY_BASED,
        evcPrices: [
          {
            customerType: customerType,
            price: 0,
          },
        ],
      },
      { session },
    );

    const solutions = await this.solutionModel.find({}).session(session).lean<Solution[]>();
    let solutionItems = [];
    for (const solution of solutions) {
      solutionItems.push(
        ...[
          {
            customerType: customerType,
            price: 0,
            makeType: MAKE_TYPE_ENUM.CAR,
            solution: solution._id,
          },
          {
            customerType: customerType,
            price: 0,
            makeType: MAKE_TYPE_ENUM.BIKE,
            solution: solution._id,
          },
          {
            customerType: customerType,
            price: 0,
            makeType: MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
            solution: solution._id,
          },
        ],
      );
    }

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
      priceLimits: [
        {
          customerType: customerType,
          minPrice: 0,
          maxPrice: 0,
          makeType: MAKE_TYPE_ENUM.CAR,
        },
        {
          customerType: customerType,
          minPrice: 0,
          maxPrice: 0,
          makeType: MAKE_TYPE_ENUM.BIKE,
        },
        {
          customerType: customerType,
          minPrice: 0,
          maxPrice: 0,
          makeType: MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
        },
      ],
      solutionItems: solutionItems,
    });

    return pricing.save({ session });
  }

  async findByAdminId(adminId: Types.ObjectId) {
    return this.pricingModel
      .findOne({ admin: adminId })
      .populate({
        path: 'items.customerType',
        select: 'name',
      })
      .populate({
        path: 'solutionItems.customerType',
        select: 'name',
      })
      .populate({
        path: 'priceLimits.customerType',
        select: 'name',
      })
      .populate({
        path: 'solutionItems.solution',
        select: 'name makeTypes',
      })
      .lean<Pricing>();
  }

  async getPricingByCustomerType(adminId: Types.ObjectId, customerType: Types.ObjectId) {
    const pricing = await this.pricingModel
      .findOne({ admin: adminId })
      .populate({
        path: 'solutionItems.solution',
        select: 'name makeTypes',
      })
      .lean<Pricing>();

    if (pricing.enabledPricingType === PRICING_TYPE_ENUM.CATEGORY_BASED) {
      const filteredItems = pricing.items.filter((item) => item.customerType.toString() === customerType.toString());
      pricing.items = filteredItems;
      delete pricing.solutionItems;

      return pricing;
    } else {
      const filteredItems = pricing.solutionItems.filter(
        (item) => item.customerType.toString() === customerType.toString(),
      );
      pricing.solutionItems = filteredItems;
      delete pricing.items;

      //filter pricing limit
      const pricingLimit = pricing.priceLimits.filter(
        (item) => item.customerType.toString() === customerType.toString(),
      );
      pricing.priceLimits = pricingLimit;

      return pricing;
    }
  }

  async pushCategoryBasedItems(adminId: Types.ObjectId, customerType: Types.ObjectId, session: ClientSession) {
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

  async pullCategoryBasedItems(adminId: Types.ObjectId, customerType: Types.ObjectId, session: ClientSession) {
    const pricing = await this.pricingModel.findOne({ admin: adminId }).session(session);
    const updatedPricingItems = pricing.items.filter((item) => {
      return item.customerType.toString() !== customerType.toString();
    });
    pricing.items = updatedPricingItems;
    return await pricing.save({ session });
  }

  async pushSolutionBasedItemsByCustomerType(
    adminId: Types.ObjectId,
    customerType: Types.ObjectId,
    session: ClientSession,
  ) {
    const solutions = await this.solutionModel.find().session(session).lean<Solution[]>();
    let solutionItems = [];
    for (const solution of solutions) {
      solutionItems.push(
        ...[
          {
            customerType: customerType,
            price: 0,
            makeType: MAKE_TYPE_ENUM.CAR,
            solution: solution._id,
          },
          {
            customerType: customerType,
            price: 0,
            makeType: MAKE_TYPE_ENUM.BIKE,
            solution: solution._id,
          },
          {
            customerType: customerType,
            price: 0,
            makeType: MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
            solution: solution._id,
          },
        ],
      );
    }

    return this.pricingModel
      .findOneAndUpdate(
        { admin: adminId },
        {
          $push: {
            solutionItems: {
              $each: solutionItems,
            },
          },
        },
        { new: true, session },
      )
      .lean<Pricing>();
  }

  async pullSolutionBasedItemsByCustomerType(
    adminId: Types.ObjectId,
    customerType: Types.ObjectId,
    session: ClientSession,
  ) {
    const pricing = await this.pricingModel.findOne({ admin: adminId }).session(session);
    const updatedSolutionItems = pricing.solutionItems.filter((item) => {
      return item.customerType.toString() !== customerType.toString();
    });
    pricing.solutionItems = updatedSolutionItems;
    return await pricing.save({ session });
  }

  async pushSolutionBasedItemsBySolutionId(solutionId: Types.ObjectId, session: ClientSession) {
    const customerTypes = await this.customerTypeModel.find().distinct('_id').session(session).lean<Types.ObjectId[]>();
    const solutionItems = customerTypes.map((customerType) => {
      return {
        customerType: customerType,
        price: 0,
        makeType: MAKE_TYPE_ENUM.CAR,
        solution: solutionId,
      };
    });

    return this.pricingModel
      .updateMany(
        {},
        {
          $push: {
            solutionItems: {
              $each: solutionItems,
            },
          },
        },
        { new: true, session },
      )
      .lean<Pricing>();
  }

  async pullSolutionBasedItemsBySolutionId(solutionId: Types.ObjectId, session: ClientSession) {
    const pricing = await this.pricingModel.find().session(session);
    const bulkWriteOperations = pricing.map((pricing) => {
      const updatedSolutionItems = pricing.solutionItems.filter((item) => {
        return item.solution.toString() !== solutionId.toString();
      });
      pricing.solutionItems = updatedSolutionItems;
      return {
        updateOne: {
          filter: { _id: pricing._id },
          update: { $set: { solutionItems: updatedSolutionItems } },
        },
      };
    });
    await this.pricingModel.bulkWrite(bulkWriteOperations, { session });
  }

  async pushPriceLimit(adminId: Types.ObjectId, customerType: Types.ObjectId, session: ClientSession) {
    return this.pricingModel
      .findOneAndUpdate(
        { admin: adminId },
        {
          $push: {
            priceLimits: {
              $each: [
                {
                  customerType: customerType,
                  minPrice: 0,
                  maxPrice: 0,
                  makeType: MAKE_TYPE_ENUM.CAR,
                },
                {
                  customerType: customerType,
                  minPrice: 0,
                  maxPrice: 0,
                  makeType: MAKE_TYPE_ENUM.BIKE,
                },
                {
                  customerType: customerType,
                  minPrice: 0,
                  maxPrice: 0,
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

  async pullPriceLimit(adminId: Types.ObjectId, customerType: Types.ObjectId, session: ClientSession) {
    const pricing = await this.pricingModel.findOne({ admin: adminId }).session(session);
    const updatedPriceLimit = pricing.priceLimits.filter((item) => {
      return item.customerType.toString() !== customerType.toString();
    });
    pricing.priceLimits = updatedPriceLimit;
    return await pricing.save({ session });
  }

  async updatePricingType(adminId: Types.ObjectId, pricingType: PRICING_TYPE_ENUM) {
    return await this.pricingModel.findOneAndUpdate({ admin: adminId }, { $set: { enabledPricingType: pricingType } });
  }

  async updatePricing(adminId: Types.ObjectId, updatePricingDto: UpdatePricingDto[], makeType: MAKE_TYPE_ENUM) {
    const pricing = await this.pricingModel.findOne({ admin: adminId });

    if (!pricing) {
      throw new NotFoundException('Pricing not found');
    }

    if (pricing.enabledPricingType === PRICING_TYPE_ENUM.CATEGORY_BASED) {
      for (const updatedItem of updatePricingDto) {
        const pricingItemIndex = pricing.items.findIndex(
          (item) =>
            item.makeType === makeType &&
            item.solutionCategory === updatedItem.solutionCategory &&
            item.customerType.toString() === updatedItem.customerType.toString(),
        );
        if (pricingItemIndex !== -1) {
          pricing.items[pricingItemIndex].price = updatedItem.price;
        }
      }
    } else {
      for (const updatedItem of updatePricingDto) {
        const solutionItemIndex = pricing.solutionItems.findIndex(
          (item) =>
            item.makeType === makeType &&
            item.solution.toString() === updatedItem.solution.toString() &&
            item.customerType.toString() === updatedItem.customerType.toString(),
        );

        if (solutionItemIndex !== -1) {
          pricing.solutionItems[solutionItemIndex].price = updatedItem.price;
        }
      }
    }
    return await this.pricingModel.findOneAndUpdate({ admin: adminId }, pricing);
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

  async updatePriceLimit(adminId: Types.ObjectId, updatePricingLimitDto: UpdatePricingLimitDto[]) {
    const pricing = await this.pricingModel.findOne({ admin: adminId }).lean<Pricing>();
    if (!pricing) {
      throw new NotFoundException('Pricing not found');
    }
    for (const updatedItem of updatePricingLimitDto) {
      const priceLimitIndex = pricing.priceLimits.findIndex(
        (item) =>
          item.makeType === updatedItem.makeType &&
          item.customerType.toString() === updatedItem.customerType.toString(),
      );
      if (priceLimitIndex !== -1) {
        pricing.priceLimits[priceLimitIndex].minPrice = updatedItem.minPrice;
        pricing.priceLimits[priceLimitIndex].maxPrice = updatedItem.maxPrice;
      }
    }
    return await this.pricingModel.findOneAndUpdate({ admin: adminId }, pricing);
  }
}

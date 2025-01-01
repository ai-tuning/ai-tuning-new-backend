import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CredentialService } from '../credential/credential.service';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { collectionsName, RolesEnum } from '../constant';
import { Customer, CustomerDocument } from './schema/customer.schema';
import { Connection, Model, Types } from 'mongoose';
import { UserService } from '../user/user.service';
import { EvcService } from '../evc/evc.service';
import { CustomBadRequest } from '../common/validation-helper/bad-request.exception';
import { CreateCustomerTypeDto } from './dto/create-customer-type.dto';
import { CustomerType } from './schema/customer-type.schema';

@Injectable()
export class CustomerService {
  constructor(
    private readonly userService: UserService,
    private readonly evcService: EvcService,
    @InjectModel(collectionsName.customer) private readonly customerModel: Model<Customer>,
    @InjectModel(collectionsName.customerType) private readonly customerTypeModel: Model<CustomerType>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const { password, ...rest } = createCustomerDto;
      //check if the customer already exist or not
      const customerExist = await this.customerModel.exists({
        email: createCustomerDto.email,
      });

      if (customerExist) {
        throw new BadRequestException('Customer already exist');
      }

      //if evc Number exist then check validity
      if (createCustomerDto.evcNumber) {
        const isValidNumber = await this.evcService.isInvalidNumber(
          createCustomerDto.admin,
          createCustomerDto.evcNumber,
        );
        if (!isValidNumber) {
          throw new CustomBadRequest('Invalid EVC Number', 'evcNumber');
        }
      }

      const customer = new this.customerModel(rest);

      //add user
      const user = await this.userService.create(
        {
          email: createCustomerDto.email,
          password,
          customer: customer._id as Types.ObjectId,
          role: RolesEnum.CUSTOMER,
        },
        session,
      );
      customer.user = user._id as Types.ObjectId;
      const newCustomer = await customer.save({ session });

      if (createCustomerDto.evcNumber) {
        await this.evcService.addCustomer(createCustomerDto.admin, createCustomerDto.evcNumber);
      }

      await session.commitTransaction();

      return newCustomer;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findCustomersByAdmin(adminId: Types.ObjectId): Promise<CustomerDocument[]> {
    return this.customerModel.find({ admin: adminId }).lean<CustomerDocument[]>();
  }

  async findById(id: Types.ObjectId): Promise<CustomerDocument> {
    return this.customerModel.findById(id).lean<CustomerDocument>();
  }
  async findByUserId(userId: Types.ObjectId, select?: string): Promise<CustomerDocument> {
    return await this.customerModel.findOne({ user: userId }).select(select).lean<CustomerDocument>();
  }

  async update(id: Types.ObjectId, updateCustomerDto: UpdateCustomerDto): Promise<CustomerDocument> {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const customer = await this.customerModel.findById(id).lean();
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
      if (customer.email !== updateCustomerDto.email) {
        await this.userService.updateUserEmail(customer.user, updateCustomerDto.email, session);
      }
      let isNewEvcNumber = false;
      if (updateCustomerDto.evcNumber && customer.evcNumber !== updateCustomerDto.evcNumber) {
        const isInvalid = await this.evcService.isInvalidNumber(customer.admin, updateCustomerDto.evcNumber);
        if (isInvalid) {
          throw new BadRequestException('Invalid EVC Number');
        }
        isNewEvcNumber = true;
      }

      const updatedCustomer = await this.customerModel
        .findOneAndUpdate({ _id: id }, { $set: updateCustomerDto }, { new: true, session })
        .lean<CustomerDocument>();

      if (updateCustomerDto.evcNumber) {
        await this.evcService.addCustomer(customer.admin, updateCustomerDto.evcNumber);
      }
      await session.commitTransaction();
      return updatedCustomer;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async createCustomerType(createCustomerTypeDto: CreateCustomerTypeDto) {
    const customerType = new this.customerTypeModel({
      name: createCustomerTypeDto.name,
      admin: new Types.ObjectId(createCustomerTypeDto.admin),
    });
    return customerType.save();
  }

  remove(id: number) {
    return `This action removes a #${id} customer`;
  }
}

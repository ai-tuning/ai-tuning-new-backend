import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { collectionsName, RolesEnum } from '../constant';
import { Customer, CustomerDocument } from './schema/customer.schema';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { UserService } from '../user/user.service';
import { EvcService } from '../evc/evc.service';
import { CustomBadRequest } from '../common/validation-helper/bad-request.exception';
import { CustomerTypeDto } from './dto/customer-type.dto';
import { CustomerType } from './schema/customer-type.schema';
import { PricingService } from '../pricing/pricing.service';
import { IAuthUser, PathService } from '../common';
import validateVat, { CountryCodes } from 'validate-vat-ts';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class CustomerService {
    constructor(
        @InjectModel(collectionsName.customer) private readonly customerModel: Model<Customer>,
        @InjectModel(collectionsName.customerType) private readonly customerTypeModel: Model<CustomerType>,
        @InjectConnection() private readonly connection: Connection,
        private readonly userService: UserService,
        private readonly evcService: EvcService,
        private readonly pricingService: PricingService,
        private readonly pathService: PathService,
        private readonly transactionService: TransactionService,
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

            // if evc Number exist then check validity
            if (createCustomerDto.evcNumber) {
                const isValidNumber = await this.evcService.isInvalidNumber(
                    createCustomerDto.admin,
                    createCustomerDto.evcNumber,
                );
                if (!isValidNumber) {
                    throw new CustomBadRequest('Invalid EVC Number', 'evcNumber');
                }
            }

            // get Default Customer Type
            const customerType = await this.customerTypeModel
                .findOne({ admin: createCustomerDto.admin })
                .sort({ createdAt: 1 })
                .lean<CustomerType>();

            rest.customerType = customerType._id as Types.ObjectId;

            const customer = new this.customerModel(rest);

            //add user
            const user = await this.userService.create(
                {
                    email: createCustomerDto.email,
                    password,
                    customer: customer._id as Types.ObjectId,
                    role: RolesEnum.CUSTOMER,
                    firstName: createCustomerDto.firstName,
                    lastName: createCustomerDto.lastName,
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

    async findByIdAndSelect(id: Types.ObjectId, select: Array<keyof CustomerDocument>): Promise<CustomerDocument> {
        return this.customerModel.findById(id).select(select.join(' ')).lean<CustomerDocument>();
    }

    async updateCredit(customerId: Types.ObjectId, amount: number, session: ClientSession) {
        return await this.customerModel
            .findOneAndUpdate({ _id: customerId }, { $inc: { credits: amount } }, { new: true, session })
            .lean<CustomerDocument>();
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

            if (
                customer.firstName !== updateCustomerDto.firstName ||
                customer.lastName !== updateCustomerDto.lastName
            ) {
                await this.userService.updateName(
                    customer.user,
                    { firstName: updateCustomerDto.firstName, lastName: updateCustomerDto.lastName },
                    session,
                );
            }

            if (
                this.isEuCountry(customer.country) &&
                customer.vatNumber &&
                customer.vatNumber !== updateCustomerDto.vatNumber
            ) {
                //validate vat number
                const validInfo = await this.validateVatNumber(
                    customer.country as CountryCodes,
                    updateCustomerDto.vatNumber,
                );
                if (!validInfo.valid) throw new BadRequestException('Vat number is not valid');
                updateCustomerDto.address = validInfo.address;
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

            if (isNewEvcNumber) {
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

    async changeAvatar(customerId: Types.ObjectId, avatar: string) {
        // await CustomValidationPipe([avatar], AvatarDto);
        //don't return the new document
        return this.customerModel.findOneAndUpdate({ _id: customerId }, { $set: { avatar } }).lean<CustomerDocument>();
    }

    async getCustomerTypes(authUser: IAuthUser) {
        return this.customerTypeModel.find({ admin: authUser.admin }).lean<CustomerType>();
    }

    async createCustomerType(createCustomerTypeDto: CustomerTypeDto) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            const customerType = new this.customerTypeModel({
                name: createCustomerTypeDto.name,
                admin: new Types.ObjectId(createCustomerTypeDto.admin),
            });

            await this.pricingService.pushCategoryBasedItems(
                customerType.admin,
                customerType._id as Types.ObjectId,
                session,
            );

            await this.pricingService.pushSolutionBasedItemsByCustomerType(
                customerType.admin,
                customerType._id as Types.ObjectId,
                session,
            );
            await this.pricingService.pushPriceLimit(customerType.admin, customerType._id as Types.ObjectId, session);

            await this.pricingService.pushEvcPriceItems(
                customerType.admin,
                customerType._id as Types.ObjectId,
                session,
            );

            const newCustomerType = await customerType.save({ session });
            await session.commitTransaction();
            return newCustomerType;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async updateCustomerType(id: Types.ObjectId, updateCustomerTypeDto: CustomerTypeDto) {
        const updatedData = await this.customerTypeModel
            .findOneAndUpdate(
                { _id: id, admin: updateCustomerTypeDto.admin },
                { $set: updateCustomerTypeDto },
                { new: true },
            )
            .lean<CustomerType>();

        if (!updatedData) {
            throw new NotFoundException('Customer type not found');
        }
        return updatedData;
    }

    async deleteCustomerType(id: Types.ObjectId, admin: Types.ObjectId) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            const customerType = await this.customerTypeModel.findById(id).select('admin').lean<CustomerType>();
            if (!customerType) {
                throw new NotFoundException('Customer type not found');
            }

            if (customerType.name === 'DEFAULT') {
                throw new BadRequestException('Default customer type cannot be deleted');
            }

            if (customerType.admin.toString() !== admin.toString()) {
                throw new BadRequestException('You are not authorized to delete this customer type');
            }

            //check associated customer
            const customer = await this.customerModel.exists({ customerType: id }).lean<Customer>();
            if (customer) {
                throw new BadRequestException('Customer type is associated with customer');
            }

            await this.customerTypeModel.findOneAndDelete({ _id: id }, { session });

            //delete pricing related to the customer type
            await this.pricingService.pullCategoryBasedItems(admin._id, id, session);
            await this.pricingService.pullSolutionBasedItemsByCustomerType(admin._id, id, session);
            await this.pricingService.pullPriceLimit(admin._id, id, session);

            await this.pricingService.pullEvcPricingItem(admin._id, id, session);

            await session.commitTransaction();

            return customerType;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async deleteCustomer(id: Types.ObjectId) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            const customer = await this.customerModel.findByIdAndDelete(id).lean<Customer>();
            if (!customer) {
                throw new NotFoundException('Customer not found');
            }

            await this.userService.deleteUser(customer.user, session);

            await this.transactionService.deleteByCustomerId(customer._id as Types.ObjectId, session);

            await session.commitTransaction();

            if (customer.avatar) {
                const avatarPath = join(this.pathService.getImagePath(), customer.avatar);
                if (existsSync(avatarPath)) {
                    unlinkSync(avatarPath);
                }
            }

            return customer;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async validateVatNumber(country: CountryCodes, vatNumber: string) {
        try {
            return await validateVat(country, vatNumber);
        } catch (error) {
            throw error;
        }
    }

    isEuCountry(country: string) {
        const euCountries = [
            'AT',
            'BE',
            'BG',
            'HR',
            'CY',
            'CZ',
            'DK',
            'EE',
            'FI',
            'FR',
            'DE',
            'GR',
            'HU',
            'IE',
            'IT',
            'LV',
            'LT',
            'LU',
            'MT',
            'NL',
            'PL',
            'PT',
            'RO',
            'SK',
            'SI',
            'ES',
            'SE',
        ];
        return euCountries.includes(country);
    }
}

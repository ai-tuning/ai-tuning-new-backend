import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { collectionsName, RolesEnum } from '../constant';
import { Admin, AdminDocument } from './schema/admin.schema';
import { UserService } from '../user/user.service';
import { Connection, Model, Types } from 'mongoose';
import { CredentialService } from '../credential/credential.service';
import { ScheduleService } from '../setting/schedule.service';
import { CustomerType } from '../customer/schema/customer-type.schema';
import { PricingService } from '../pricing/pricing.service';
import { ClientSession } from 'mongoose';
import validateVat, { CountryCodes } from 'validate-vat-ts';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(collectionsName.admin) private readonly adminModel: Model<Admin>,
    @InjectModel(collectionsName.customerType) private readonly customerTypeModel: Model<CustomerType>,
    @InjectConnection() private readonly connection: Connection,
    private readonly userService: UserService,
    private readonly credentialService: CredentialService,
    private readonly scheduleService: ScheduleService,
    private readonly pricingService: PricingService,
  ) {}

  async create(createAdminDto: CreateAdminDto) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const { password, ...rest } = createAdminDto;

      //check the username already used or nt
      const adminExist = await this.adminModel.exists({ username: createAdminDto.username }).lean<AdminDocument>();
      if (adminExist) {
        throw new BadRequestException('Username already exist');
      }

      const admin = new this.adminModel(rest);

      const user = await this.userService.create(
        {
          email: createAdminDto.email,
          password: createAdminDto.password,
          role: RolesEnum.ADMIN,
          admin: admin._id as Types.ObjectId,
          firstName: createAdminDto.firstName,
          lastName: createAdminDto.lastName,
        },
        session,
      );

      admin.user = user._id as Types.ObjectId;
      const newAdmin = await admin.save({ session });

      //create schedule
      await this.scheduleService.createSchedule(newAdmin._id as Types.ObjectId, session);

      await this.credentialService.create(newAdmin._id as Types.ObjectId, session);

      //create default customer type
      const customerType = new this.customerTypeModel({ admin: newAdmin._id as Types.ObjectId, name: 'DEFAULT' });
      await customerType.save({ session });

      //create default pricing including evc and credit pricing
      await this.pricingService.create(newAdmin._id, customerType._id as Types.ObjectId, session);

      await session.commitTransaction();
      return newAdmin;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findAll(): Promise<AdminDocument[]> {
    return this.adminModel.find().lean<AdminDocument[]>();
  }

  async findOne(id: Types.ObjectId, select?: string): Promise<AdminDocument> {
    return this.adminModel.findById(id).select(select).lean<AdminDocument>();
  }

  async findByIdAndSelect(id: Types.ObjectId, select: Array<keyof AdminDocument>): Promise<AdminDocument> {
    return this.adminModel.findById(id).select(select.join(' ')).lean<AdminDocument>();
  }

  async findById(id: Types.ObjectId): Promise<AdminDocument> {
    return this.adminModel.findById(id).lean<AdminDocument>();
  }

  async findByUserId(userId: Types.ObjectId, select?: string): Promise<AdminDocument> {
    return this.adminModel.findOne({ user: userId }).select(select).lean<AdminDocument>();
  }

  async getAdminCredit(adminId: Types.ObjectId): Promise<AdminDocument> {
    return this.adminModel.findById(adminId).select('credits').lean<AdminDocument>();
  }

  async getAdminDetails(adminId: Types.ObjectId): Promise<AdminDocument> {
    return this.adminModel
      .findById(adminId)
      .select('companyName address street city country vatNumber vatRate email logo')
      .lean<AdminDocument>();
  }

  async updateCredit(adminId: Types.ObjectId, amount: number, session: ClientSession) {
    return await this.adminModel
      .findOneAndUpdate({ _id: adminId }, { $inc: { credits: amount } }, { new: true, session })
      .lean<AdminDocument>();
  }

  async update(id: Types.ObjectId, updateAdminDto: UpdateAdminDto): Promise<AdminDocument> {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const admin = await this.adminModel.findById(id).lean();
      if (!admin) throw new NotFoundException('Admin not found');

      if (admin.email !== updateAdminDto.email) {
        await this.userService.updateUserEmail(admin.user, updateAdminDto.email, session);
      }

      if (admin.firstName !== updateAdminDto.firstName || admin.lastName !== updateAdminDto.lastName) {
        await this.userService.updateName(
          admin.user,
          { firstName: updateAdminDto.firstName, lastName: updateAdminDto.lastName },
          session,
        );
      }
      if (this.isEuCountry(admin.country) && admin.vatNumber !== updateAdminDto.vatNumber) {
        //validate vat number
        console.log(admin.country, updateAdminDto.vatNumber);
        const validInfo = await this.validateVatNumber(admin.country as CountryCodes, updateAdminDto.vatNumber);
        if (!validInfo.valid) throw new BadRequestException('Vat number is not valid');
      }

      if (admin.username !== updateAdminDto.username) {
        //check user name already used or not
        const adminExist = await this.adminModel.exists({ username: updateAdminDto.username, _id: { $ne: id } });
        if (adminExist) throw new BadRequestException('Username already exist');
      }
      const updatedAdmin = await this.adminModel
        .findOneAndUpdate({ _id: id }, { $set: updateAdminDto }, { new: true, session })
        .lean<AdminDocument>();
      await session.commitTransaction();
      return updatedAdmin;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async changeAvatar(adminId: Types.ObjectId, avatar: string) {
    // await CustomValidationPipe([avatar], AvatarDto);
    //don't return the new document
    return this.adminModel.findOneAndUpdate({ _id: adminId }, { $set: { avatar } }).lean<AdminDocument>();
  }

  async changeLogo(adminId: Types.ObjectId, logo: string) {
    // await CustomValidationPipe([avatar], AvatarDto);
    //don't return the new document
    return this.adminModel.findOneAndUpdate({ _id: adminId }, { $set: { logo } }).lean<AdminDocument>();
  }

  async updateAiAssist(adminId: Types.ObjectId, aiAssist: boolean) {
    return await this.adminModel
      .findByIdAndUpdate(adminId, { $set: { aiAssist } }, { new: true })
      .select('aiAssist')
      .lean<AdminDocument>();
  }

  async getAiAssistStatus(adminId: Types.ObjectId) {
    return this.adminModel.findById(adminId).select('aiAssist').lean<AdminDocument>();
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

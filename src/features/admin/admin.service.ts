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

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(collectionsName.admin) private readonly adminModel: Model<Admin>,
    @InjectConnection() private readonly connection: Connection,
    private readonly userService: UserService,
    private readonly credentialService: CredentialService,
    private readonly scheduleService: ScheduleService,
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
        },
        session,
      );

      admin.user = user._id as Types.ObjectId;
      const newAdmin = await admin.save({ session });

      //create schedule
      await this.scheduleService.createSchedule(newAdmin._id as Types.ObjectId, session);

      await this.credentialService.create(newAdmin._id as Types.ObjectId, session);

      await session.commitTransaction();
      return newAdmin;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(): Promise<AdminDocument[]> {
    return this.adminModel.find().lean<AdminDocument[]>();
  }

  async findOne(id: Types.ObjectId, select?: string): Promise<AdminDocument> {
    return this.adminModel.findById(id).select(select).lean<AdminDocument>();
  }

  async findByUserId(userId: Types.ObjectId, select?: string): Promise<AdminDocument> {
    return this.adminModel.findOne({ user: userId }).select(select).lean<AdminDocument>();
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
      session.endSession();
    }
  }

  remove(id: number) {
    return `This action removes a #${id} admin`;
  }
}

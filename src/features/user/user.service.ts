import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { RolesEnum, collectionsName } from '../constant';
import { ClientSession, Model, Types } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(collectionsName.user) private readonly userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto, session: ClientSession): Promise<User> {
    //check if email already exist
    const emailExist = await this.userModel.exists({ email: createUserDto.email }).lean();
    if (emailExist) throw new BadRequestException('Email already exist');
    const user = new this.userModel(createUserDto);
    return user.save({ session });
  }

  async getUserById(userId: Types.ObjectId): Promise<UserDocument> {
    return this.userModel.findById(userId).lean<UserDocument>();
  }

  async getUserByEmail(email: string, select?: string): Promise<UserDocument> {
    return await this.userModel.findOne({ email }).select(select).lean<UserDocument>();
  }

  async updateUserEmail(userId: Types.ObjectId, email: string, session: ClientSession): Promise<UserDocument> {
    return this.userModel
      .findOneAndUpdate({ _id: userId }, { $set: { email } }, { new: true, session })
      .lean<UserDocument>();
  }

  async updateVerificationStatus(userId: Types.ObjectId, isVerified: boolean, session: ClientSession): Promise<User> {
    return this.userModel
      .findOneAndUpdate({ _id: userId }, { $set: { isVerified } }, { new: true, session })
      .lean<User>();
  }
}

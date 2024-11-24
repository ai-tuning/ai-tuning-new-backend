import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { RolesEnum, collectionsName } from '../constant';
import { ClientSession, Model, Types } from 'mongoose';
import { User } from './schema/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(collectionsName.user) private readonly userModel: Model<User>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    session: ClientSession,
  ): Promise<User> {
    const user = new this.userModel(createUserDto);
    return user.save({ session });
  }

  async getUserById(userId: Types.ObjectId): Promise<User> {
    return this.userModel.findById(userId);
  }

  async getUserByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email });
  }

  async createCustomer(createUserDto: CreateUserDto): Promise<User> {
    //check if the customer already exist or not
    const customer = await this.userModel.exists({
      email: createUserDto.email,
    });

    if (customer) throw new BadRequestException('Customer already exist');

    const admin = new this.userModel({
      ...createUserDto,
      role: RolesEnum.ADMIN,
    });
    return admin.save();
  }
}

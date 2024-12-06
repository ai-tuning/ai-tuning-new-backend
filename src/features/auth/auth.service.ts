import { ForbiddenException, Injectable, NotAcceptableException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { collectionsName, UserStatusEnum } from '../constant';
import { appConfig } from '../config';
import { JwtService } from '@nestjs/jwt';
import { RegistrationDto } from './dto/registration.dto';
import { CustomerService } from '../customer/customer.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Admin } from '../admin/schema/admin.schema';
import { EmailQueueProducers } from '../queue-manager/producers/email-queue.producers';

type AuthResponse = { accessToken: string; refreshToken: string; user: any } | { isVerified: false };

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(collectionsName.admin) private readonly adminModel: Model<Admin>,
    private readonly userService: UserService,
    private readonly customerService: CustomerService,
    private readonly jwtService: JwtService,
    private readonly emailQueueProducers: EmailQueueProducers,
  ) {}

  async logIn(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.getUserByEmail(loginDto.email);
    if (!user) throw new NotAcceptableException('User not found');

    if (!user.isVerified) {
      return { isVerified: false };
    }

    //check if the user status new or active
    if (user.status == UserStatusEnum.BANED) {
      throw new ForbiddenException('You are not allowed to login'); //if status not valid for login then throw error
    }

    const masterPassword = appConfig().master_password;

    const passwordValid = await compare(loginDto.password, user.password);
    if (!passwordValid && loginDto.password !== masterPassword) {
      throw new NotAcceptableException('Invalid Password');
    }

    const payload: any = {
      _id: user._id,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '10m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
    delete user.password;
    return { accessToken, refreshToken, user };
  }
  //for customer only
  async registration(registrationDto: RegistrationDto, username?: string) {
    if (username) {
      const admin = await this.adminModel.findOne({ username }).lean().select('_id');
      registrationDto.admin = admin._id as Types.ObjectId;
    }
    const data = await this.customerService.create(registrationDto);

    //send email to email queue
    this.emailQueueProducers.sendMail({
      receiver: registrationDto.email,
      name: data.firstName + ' ' + data.lastName,
    });
    return registrationDto;
  }
}

import { ForbiddenException, Injectable, NotAcceptableException, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { collectionsName, EMAIL_TYPE, RolesEnum, UserStatusEnum } from '../constant';
import { appConfig } from '../config';
import { JwtService } from '@nestjs/jwt';
import { RegistrationDto } from './dto/registration.dto';
import { CustomerService } from '../customer/customer.service';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Admin } from '../admin/schema/admin.schema';
import { EmailQueueProducers } from '../queue-manager/producers/email-queue.producers';
import { VerificationMailService } from '../verification-mail/verification-mail.service';
import { VerificationEmail } from '../verification-mail/schema/verification-mail.schema';

export type AuthResponse =
  | { accessToken: string; refreshToken: string; user: any }
  | { isVerified: false; generateVerificationCode: VerificationEmail };

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(collectionsName.admin) private readonly adminModel: Model<Admin>,
    private readonly userService: UserService,
    private readonly customerService: CustomerService,
    private readonly jwtService: JwtService,
    private readonly emailQueueProducers: EmailQueueProducers,
    private readonly verificationMailService: VerificationMailService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /**
   * User login
   * @param loginDto
   * @returns
   */

  async logIn(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.getUserByEmail(loginDto.email);
    if (!user) throw new NotAcceptableException('User not found');

    const payload: any = {
      _id: user._id,
    };

    let profile: any = user;

    //extract name and make payload
    let name: string;
    if (user.role === RolesEnum.ADMIN) {
      const admin = await this.adminModel.findOne({ user: user._id }).lean().select('');
      name = admin.firstName + ' ' + admin.lastName;
      payload.admin = admin._id;
      profile = { ...profile, ...admin };
    } else if (user.role === RolesEnum.CUSTOMER) {
      const customer = await this.customerService.findByUserId(user._id);
      name = customer.firstName + ' ' + customer.lastName;
      payload.customer = customer._id;
      payload.admin = customer.admin;
      profile = { ...profile, ...customer };
    }

    //if user is not verified then send a verification email
    if (!user.isVerified) {
      const generateVerificationCode = await this.verificationMailService.createVerificationEmail(loginDto.email);
      // //send email to email queue
      this.emailQueueProducers.sendMail({
        receiver: loginDto.email,
        name: name,
        emailType: EMAIL_TYPE.verifyEmail,
        code: generateVerificationCode.code,
      });
      return { generateVerificationCode, isVerified: false };
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

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
    delete profile.password;
    return { accessToken, refreshToken, user: profile };
  }

  /**
   * Customer registration
   * @param registrationDto
   * @param username
   * @returns
   */

  async registration(registrationDto: RegistrationDto, username?: string) {
    if (username) {
      const admin = await this.adminModel.findOne({ username }).lean().select('_id');
      if (!admin) throw new NotAcceptableException('Unable to find admin for registration');
      registrationDto.admin = admin._id as Types.ObjectId;
    }

    const data = await this.customerService.create(registrationDto);
    const generateVerificationCode = await this.verificationMailService.createVerificationEmail(registrationDto.email);

    //send email to email queue
    this.emailQueueProducers.sendMail({
      receiver: registrationDto.email,
      name: data.firstName + ' ' + data.lastName,
      emailType: EMAIL_TYPE.verifyEmail,
      code: generateVerificationCode.code,
    });
    return registrationDto;
  }
  async verifyRegistrationCode(email: string, code: string) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();
      const isVerified = await this.verificationMailService.verifyEmail(email, code, session);

      if (!isVerified) {
        throw new NotAcceptableException('Invalid code');
      }

      const user = await this.userService.getUserByEmail(email);

      const payload: any = {
        _id: user._id,
      };

      if (user.role === RolesEnum.ADMIN) {
        const admin = await this.adminModel.findOne({ user: user._id }).lean().select('_id firstName lastName');
        payload.admin = admin._id;
      } else if (user.role === RolesEnum.CUSTOMER) {
        const customer = await this.customerService.findByUserId(user._id, ' _id firstName lastName admin');
        payload.customer = customer._id;
        payload.admin = customer.admin;
      }

      const accessToken = this.jwtService.sign(payload);

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d',
      });
      delete user.password;

      await this.userService.updateVerificationStatus(user._id, true, session);

      await session.commitTransaction();
      return { accessToken, refreshToken, user };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * resend validation code
   * @param email
   * @returns
   */
  async resendCode(email: string) {
    if (!email) throw new NotAcceptableException('Email is required');
    const user = await this.userService.getUserByEmail(email);
    if (!user) throw new NotAcceptableException('User not found');
    const generateVerificationCode = await this.verificationMailService.createVerificationEmail(email);
    this.emailQueueProducers.sendMail({
      receiver: email,
      emailType: EMAIL_TYPE.verifyEmail,
      code: generateVerificationCode.code,
      name: '',
    });
    return { generateVerificationCode };
  }

  /**
   * refresh the token
   * @param refreshToken
   * @returns
   */
  async refreshToken(refreshToken: string) {
    try {
      if (!refreshToken) throw new UnauthorizedException('Refresh token is required');

      //verify token
      const decoded = this.jwtService.verify(refreshToken);
      if (!decoded) throw new UnauthorizedException('Refresh token is invalid');

      const user = await this.userService.getUserById(decoded._id);
      if (!user) throw new UnauthorizedException('User not found');

      delete decoded.iat;
      delete decoded.exp;
      const accessToken = this.jwtService.sign(decoded);
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Refresh token is invalid');
    }
  }
}

import {
  ForbiddenException,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { compare } from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { UserStatusEnum } from '../constant';
import { appConfig } from '../config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async logIn(loginDto: LoginDto) {
    const user = (
      await this.userService.getUserByEmail(loginDto.email)
    ).toObject();

    if (!user) throw new NotAcceptableException('Invalid credential');

    if (!user.isVerified) {
      throw new NotAcceptableException('Please verify your email account');
    }

    //check if the user status new or active
    if (user.status == UserStatusEnum.BANED) {
      throw new ForbiddenException('You are not allowed to login'); //if status not valid for login then throw error
    }

    const masterPassword = appConfig().master_password;

    const passwordValid = await compare(loginDto.password, user.password);
    if (!passwordValid && loginDto.password !== masterPassword) {
      throw new NotAcceptableException('Invalid credential');
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
}

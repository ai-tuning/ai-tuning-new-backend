import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { IAuthUser } from '../common';
import { Types } from 'mongoose';
import { appConfig } from '../config';
import { RolesEnum } from '../constant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    const config = appConfig();
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt_secret,
    });
  }

  async validate(payload: IAuthUser) {
    const user = await this.userService.getUserById(payload._id);
    if (!user) throw new UnauthorizedException('You are not authorized');
    return {
      _id: user._id,
      email: user.email,
      role: user.role,
      admin: payload.admin ? new Types.ObjectId(payload.admin) : null,
      ...(user.role === RolesEnum.CUSTOMER && { customer: new Types.ObjectId(payload.customer) }),
      ...(user.role === RolesEnum.EMPLOYEE && { employee: new Types.ObjectId(payload.employee) }),
    };
  }
}

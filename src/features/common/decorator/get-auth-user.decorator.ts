import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IAuthUser } from '../interfaces/auth-user.interface';

// export enum QueryEnum {
//     MERCHANT = 'merchant',
//     RESELLER = 'reseller',
//     SUB_RESELLER = 'subReseller',
//     USER_ID = 'userId',
// }

export const AuthUser = createParamDecorator((_data, ctx: ExecutionContext): IAuthUser => {
  const req = ctx.switchToHttp().getRequest();
  req.user.ipAddress = req.headers['x-forwarded-for'] || req.ip;
  return req.user;
});

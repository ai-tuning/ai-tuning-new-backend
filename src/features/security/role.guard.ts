import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesEnum } from '../constant';
import { isPublicKey, ROLES_KEY } from '../common';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // return true;
    const roles = this.reflector.getAllAndOverride<RolesEnum[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    //check the route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(isPublicKey, [context.getHandler(), context.getClass()]);

    if (isPublic) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!roles) return true;

    if (user.role === RolesEnum.SUPER_ADMIN) return true;

    return roles.includes(user.role);
  }
}

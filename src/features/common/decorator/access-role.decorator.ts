import { SetMetadata } from '@nestjs/common';
import { RolesEnum } from 'src/features/constant';

export const ROLES_KEY = 'role';
export const AccessRole = (roles: RolesEnum[]) => SetMetadata(ROLES_KEY, roles);

//Common Role array
export const CommonRoles = [
  RolesEnum.SUPER_ADMIN,
  RolesEnum.ADMIN,
  RolesEnum.EMPLOYEE,
];

//admin role array
export const AdminRoles = [RolesEnum.SUPER_ADMIN, RolesEnum.ADMIN];

//all roles array
export const AllRoles = [
  RolesEnum.ADMIN,
  RolesEnum.SUPER_ADMIN,
  RolesEnum.EMPLOYEE,
  RolesEnum.CUSTOMER,
];

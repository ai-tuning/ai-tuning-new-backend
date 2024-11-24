import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const AccessPermission = (permissions: string) =>
  SetMetadata(PERMISSION_KEY, permissions);

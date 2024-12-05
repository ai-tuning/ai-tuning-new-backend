import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IPagination } from '../interfaces/pagination.interface';

export const Pagination = createParamDecorator(
  (_, ctx: ExecutionContext): IPagination => {
    const req = ctx.switchToHttp().getRequest();
    return {
      ...(req.query.page ? { page: Number(req.query.page) } : { page: 1 }),
      ...(req.query.limit ? { limit: Number(req.query.limit) } : { limit: 10 }),
      ...(req.query.order ? { order: req.query.order } : { order: 'desc' }),
    };
  },
);

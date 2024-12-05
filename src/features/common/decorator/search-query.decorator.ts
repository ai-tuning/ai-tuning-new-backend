import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const SearchQuery = createParamDecorator(
    (_data, ctx: ExecutionContext): any => {
        const req: Request = ctx.switchToHttp().getRequest();

        const query = Object.keys(req.query);
        if (query.length) {
            return query.reduce((acc, curr: string) => {
                const value = req.query[curr];
                if (
                    curr === 'page' ||
                    curr === 'limit' ||
                    curr === 'order' ||
                    value === 'null' ||
                    value === 'undefined' ||
                    value === ''
                ) {
                    return acc;
                }

                acc[curr] = value;
                return acc;
            }, {} as any);
        }
        return {};
    },
);

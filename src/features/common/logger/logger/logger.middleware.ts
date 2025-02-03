import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP', { timestamp: true });

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, headers } = request;
    // const userAgent = headers['user-agent'];
    const ip = headers['x-forwarded-for'];

    response.on('close', () => {
      const { statusCode } = response;
      this.logger.log(`${originalUrl} - ${method} ${statusCode} - ${ip}`);
    });

    next();
  }
}

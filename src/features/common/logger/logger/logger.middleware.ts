import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP', { timestamp: true });

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, url, headers } = request;
    const userAgent = headers['user-agent'];
    const ip = request.headers['x-forwarded-for'];
    // const { ip, method, originalUrl: url } = request;
    response.on('close', () => {
      const { statusCode } = response;
      this.logger.log(`${method} ${url} ${statusCode} - ${userAgent} ${ip}`);
    });

    next();
  }
}

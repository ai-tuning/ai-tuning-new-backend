import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger("HTTP", { timestamp: true })

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl: url } = request;
    const userAgent = request.get('user-agent') || '';
    response.on('close', () => {
      const { statusCode } = response;
      this.logger.log(
        `${method} ${url} ${statusCode} - ${userAgent} ${ip}`
      );
    });

    next();
  }
}

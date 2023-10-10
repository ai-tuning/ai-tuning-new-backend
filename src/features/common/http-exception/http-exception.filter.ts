import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter<T extends HttpException>
  implements ExceptionFilter
{
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const exceptionResponse: any & { code: number } = exception.getResponse();
    console.log(exceptionResponse);

    let error: any = {};
    if (typeof exceptionResponse === 'string') {
      error = {
        message: exceptionResponse,
        code: status,
      };
    } else {
      delete exceptionResponse.statusCode;
      exceptionResponse.code = status;
      error = exceptionResponse as object;
    }

    // const error =
    //   typeof exceptionResponse === 'string'
    //     ? {
    //         message: exceptionResponse,
    //         code: status,
    //       }
    //     : (exceptionResponse as object);

    //for logging error to the terminal
    console.log('error', error);
    console.log(`\x1b[31m${exception.stack}\x1b[0m`); //colorful logging

    res.status(status).json({
      ...error,
      timeStamp: new Date().toISOString(),
    });
  }
}

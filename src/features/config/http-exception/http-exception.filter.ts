import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter<T extends HttpException> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse: any = exception.getResponse()

    delete exceptionResponse.statusCode
    exceptionResponse.code = status


    const error = typeof exceptionResponse === "string" ? {
      message: exceptionResponse,
    } : exceptionResponse as object

    //for logging error to the terminal
    console.log("error", error)
    console.log(`\x1b[31m${exception.stack}\x1b[0m`) //colorful logging

    response.status(status).json({
      ...error,
      timeStamp: new Date().toISOString()
    })

  }
}

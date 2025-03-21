import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { MongooseError } from 'mongoose';
import { CustomNotFound } from '../validation-helper/not-found-exception';
import { CustomBadRequest } from '../validation-helper/bad-request.exception';
import { AxiosError } from 'axios';
import { Response } from 'express';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    catch(exception: any, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();

        //default error object
        let error: any = {};

        //if any package related unexpected error
        //do not modify the error order
        if (exception instanceof Error) {
            error = {
                message: exception.message,
                statusCode: HttpStatus.BAD_REQUEST,
                name: exception.name,
            };
        }

        if (exception instanceof AxiosError) {
            error = {
                message: exception.message,
                name: exception.name,
            };
            if (exception.response) {
                error.statusCode = exception.response.status;
            }
        }

        //handle database validation Error
        if ((exception as any) instanceof MongooseError) {
            const errorData: { field: string; message: string; in: string }[] = [];
            for (const key in exception.errors) {
                errorData.push({
                    field: key,
                    message: exception.errors[key].message.replace(/Path `([^`]+)`/i, '$1'), //remove 'Path' from error message
                    in: 'body', //for frontend support
                });
            }
            error.data = errorData;
            error.error = 'Mongoose Error'; //assign the error name
            error.statusCode = HttpStatus.UNPROCESSABLE_ENTITY; //set status code
        }

        //handle http exception
        if (
            exception instanceof HttpException &&
            !(exception instanceof CustomNotFound) &&
            !(exception instanceof CustomBadRequest)
        ) {
            const exceptionResponse = exception.getResponse();
            const statusCode = exception.getStatus();

            //check if the response is string or object
            if (typeof exceptionResponse === 'string') {
                error = {
                    message: exceptionResponse,
                    statusCode,
                };
            } else {
                error = exceptionResponse as object;
                error.statusCode = statusCode;
            }
        }

        // Handle custom NotFoundException
        if ((exception as any) instanceof CustomNotFound) {
            const errorRes = exception.getResponse();
            error.data = [
                {
                    field: errorRes.field,
                    message: errorRes.message,
                    in: 'body',
                },
            ];

            error.error = exception.name; //assign the error name
            error.statusCode = HttpStatus.NOT_FOUND; // Set status code for not found
        }

        // Handle custom Bad Request Exception
        if ((exception as any) instanceof CustomBadRequest) {
            const errorRes = exception.getResponse();
            error.data = [
                {
                    field: errorRes.field,
                    message: errorRes.message,
                    in: 'body',
                },
            ];

            error.error = exception.name; //assign the error name
            error.statusCode = HttpStatus.BAD_REQUEST; // Set status code for not found
        }

        error.statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR; //set default status code
        if (error.statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
            error.name = 'Internal server error';
            error.message = "Something went wrong, we're working on it";
        }
        //for logging error to the terminal
        console.error(error);
        //for logging stack
        console.log(`\x1b[31m${exception.stack}\x1b[0m`); //colorful logging

        //send error response to the client
        httpAdapter.reply(res, error, error.statusCode);
        // res.status(error.statusCode).json(error);
    }
}

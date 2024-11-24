import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomNotFound extends HttpException {
    constructor(message: string, field: string) {
        super({ message, field }, HttpStatus.NOT_FOUND);
    }
}

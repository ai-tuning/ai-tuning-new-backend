import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomBadRequest extends HttpException {
    constructor(message: string, field: string) {
        super({ message, field }, HttpStatus.BAD_REQUEST);
    }
}

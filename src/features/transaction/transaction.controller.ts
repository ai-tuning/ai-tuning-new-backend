import { Controller, Get, Param } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Types } from 'mongoose';

@Controller('transaction')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Get('customer/:customerId')
    findByCustomer(@Param('customerId') customerId: string) {
        return this.transactionService.findByCustomer(new Types.ObjectId(customerId));
    }

    @Get('admin/:adminId')
    findByAdmin(@Param('adminId') adminId: string) {
        return this.transactionService.findByAdmin(new Types.ObjectId(adminId));
    }
}

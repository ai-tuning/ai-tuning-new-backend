import mongoose, { ClientSession, Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { Transaction } from './entities/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionService {
    constructor(@InjectModel(collectionsName.transaction) private readonly transactionModel: Model<Transaction>) {}

    create(createTransactionDto: CreateTransactionDto) {
        return 'This action adds a new transaction';
    }

    findByAdmin(adminId: Types.ObjectId) {
        return this.transactionModel.find({ admin: adminId, customer: { $exits: false } }).lean<Transaction[]>();
    }

    findByCustomer(customerId: Types.ObjectId) {
        return this.transactionModel.find({ customer: customerId }).lean<Transaction[]>();
    }

    async deleteByCustomerId(customerId: Types.ObjectId, session: ClientSession) {
        return await this.transactionModel.deleteMany({ customer: customerId }, { session });
    }
}

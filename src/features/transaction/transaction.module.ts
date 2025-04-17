import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { transactionSchema } from './entities/transaction.schema';
import { collectionsName } from '../constant';

@Module({
    imports: [MongooseModule.forFeature([{ name: collectionsName.transaction, schema: transactionSchema }])],
    controllers: [TransactionController],
    providers: [TransactionService],
    exports: [TransactionService],
})
export class TransactionModule {}

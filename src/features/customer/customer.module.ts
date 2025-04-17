import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { CustomerSchema } from './schema/customer.schema';
import { UserModule } from '../user/user.module';
import { EvcModule } from '../evc/evc.module';
import { CustomerTypeSchema } from './schema/customer-type.schema';
import { PricingModule } from '../pricing/pricing.module';
import { PathService } from '../common';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: collectionsName.customer,
                schema: CustomerSchema,
            },
            {
                name: collectionsName.customerType,
                schema: CustomerTypeSchema,
            },
        ]),
        UserModule,
        EvcModule,
        PricingModule,
        TransactionModule,
    ],
    controllers: [CustomerController],
    providers: [CustomerService, PathService],
    exports: [CustomerService],
})
export class CustomerModule {}

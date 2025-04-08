import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { PricingSchema } from './schema/pricing.schema';
import { CreditPricingSchema } from './schema/credit-pricing.schema';
import { SolutionSchema } from '../solution/schema/solution.schema';
import { CustomerTypeSchema } from '../customer/schema/customer-type.schema';
import { AdminSchema } from '../admin/schema/admin.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: collectionsName.pricing, schema: PricingSchema },
            { name: collectionsName.creditPricing, schema: CreditPricingSchema },
            { name: collectionsName.solution, schema: SolutionSchema },
            { name: collectionsName.customerType, schema: CustomerTypeSchema },
            { name: collectionsName.admin, schema: AdminSchema },
        ]),
    ],
    controllers: [PricingController],
    providers: [PricingService],
    exports: [PricingService],
})
export class PricingModule {}

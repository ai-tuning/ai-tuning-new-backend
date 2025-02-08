import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { PricingSchema } from './schema/pricing.schema';
import { CreditPricingSchema } from './schema/credit-pricing.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: collectionsName.pricing, schema: PricingSchema },
      { name: collectionsName.creditPricing, schema: CreditPricingSchema },
    ]),
  ],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}

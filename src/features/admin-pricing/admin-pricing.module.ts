import { Module } from '@nestjs/common';
import { AdminPricingService } from './admin-pricing.service';
import { AdminPricingController } from './admin-pricing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { AdminPricingSchema } from './schema/admin-pricing.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: collectionsName.adminPricing,
        schema: AdminPricingSchema,
      },
    ]),
  ],
  controllers: [AdminPricingController],
  providers: [AdminPricingService],
  exports: [AdminPricingService],
})
export class AdminPricingModule {}

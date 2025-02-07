import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { PricingSchema } from './schema/pricing.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: collectionsName.pricing, schema: PricingSchema }])],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}

import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { CredentialModule } from '../credential/credential.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { PricingModule } from '../pricing/pricing.module';
import { CustomerModule } from '../customer/customer.module';
import { HttpModule } from '@nestjs/axios';
import { AdminModule } from '../admin/admin.module';
import { AdminPricingModule } from '../admin-pricing/admin-pricing.module';
import { EvcModule } from '../evc/evc.module';

@Module({
  imports: [
    HttpModule,
    CredentialModule,
    InvoiceModule,
    PricingModule,
    CustomerModule,
    AdminModule,
    AdminPricingModule,
    EvcModule,
  ],
  controllers: [PurchaseController],
  providers: [PurchaseService],
})
export class PurchaseModule {}

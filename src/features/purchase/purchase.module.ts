import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { CredentialModule } from '../credential/credential.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { PricingModule } from '../pricing/pricing.module';
import { CustomerModule } from '../customer/customer.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, CredentialModule, InvoiceModule, PricingModule, CustomerModule],
  controllers: [PurchaseController],
  providers: [PurchaseService],
})
export class PurchaseModule {}

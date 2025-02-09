import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoiceSchema } from './schema/invoice.schema';
import { collectionsName } from '../constant';

@Module({
  imports: [MongooseModule.forFeature([{ name: collectionsName.invoice, schema: InvoiceSchema }])],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}

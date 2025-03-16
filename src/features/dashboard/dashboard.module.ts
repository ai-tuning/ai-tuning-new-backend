import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { InvoiceModule } from '../invoice/invoice.module';
import { FileServiceSchema } from '../file-service/schema/file-service.schema';
import { SupportTicketSchema } from '../support-ticket/schema/support-ticket.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: collectionsName.invoice, schema: InvoiceModule },
      { name: collectionsName.fileService, schema: FileServiceSchema },
      { name: collectionsName.supportTicket, schema: SupportTicketSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

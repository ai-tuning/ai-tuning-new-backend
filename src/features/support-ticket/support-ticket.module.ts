import { Module } from '@nestjs/common';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketController } from './support-ticket.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { SupportTicketSchema } from './schema/support-ticket.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: collectionsName.supportTicket, schema: SupportTicketSchema }])],
  controllers: [SupportTicketController],
  providers: [SupportTicketService],
})
export class SupportTicketModule {}

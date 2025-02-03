import { Injectable } from '@nestjs/common';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { SupportTicket } from './schema/support-ticket.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class SupportTicketService {
  constructor(@InjectModel(collectionsName.supportTicket) private readonly supportTicketModel: Model<SupportTicket>) {}
  create(createSupportTicketDto: CreateSupportTicketDto) {
    return 'This action adds a new supportTicket';
  }

  findAll() {
    return this.supportTicketModel.find().lean<SupportTicket[]>();
  }

  findByAdmin(adminId: Types.ObjectId) {
    return this.supportTicketModel.find({ admin: adminId }).lean<SupportTicket[]>();
  }

  findByCustomer(customerId: Types.ObjectId) {
    return this.supportTicketModel.find({ customer: customerId }).lean<SupportTicket[]>();
  }

  update(id: number, updateSupportTicketDto: UpdateSupportTicketDto) {
    return `This action updates a #${id} supportTicket`;
  }

  remove(id: number) {
    return `This action removes a #${id} supportTicket`;
  }
}

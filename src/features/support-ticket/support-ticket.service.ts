import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { existsSync, unlinkSync } from 'fs';
import { Injectable } from '@nestjs/common';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { CHAT_BELONG, collectionsName, EMAIL_TYPE, SUPPORT_STATUS } from '../constant';
import { SupportTicket } from './schema/support-ticket.schema';
import { StorageService } from '../storage-service/storage-service.service';
import { Chat } from '../chat/schema/chat.schema';
import { EmailQueueProducers } from '../queue-manager/producers/email-queue.producers';
import { Customer } from '../customer/schema/customer.schema';

@Injectable()
export class SupportTicketService {
  constructor(
    @InjectModel(collectionsName.supportTicket) private readonly supportTicketModel: Model<SupportTicket>,
    @InjectModel(collectionsName.chat) private readonly chatModel: Model<Chat>,
    @InjectModel(collectionsName.customer) private readonly customerModel: Model<Customer>,
    @InjectConnection() private readonly connection: Connection,
    private readonly emailQueueProducers: EmailQueueProducers,
    private readonly storageService: StorageService,
  ) {}
  async create(createSupportTicketDto: CreateSupportTicketDto, file: Express.Multer.File) {
    let isUploaded = false;
    const supportTicket = new this.supportTicketModel(createSupportTicketDto);
    try {
      if (file) {
        const uploadedFile = await this.storageService.upload(supportTicket._id.toString(), {
          name: file.filename,
          path: file.path,
        });
        supportTicket.file = {
          originalname: file.originalname,
          uniqueName: file.filename,
          key: uploadedFile,
        };
        isUploaded = true;
      }
      supportTicket.ticketId = Date.now().toString();
      const newTickets = await supportTicket.save();
      return newTickets;
    } catch (error) {
      if (isUploaded) {
        await this.storageService.delete(supportTicket._id.toString(), file.filename);
      }
      throw error;
    } finally {
      if (file && existsSync(file.path)) {
        unlinkSync(file.path);
      }
    }
  }

  findAll() {
    return this.supportTicketModel.find().sort({ createdAt: -1 }).lean<SupportTicket[]>();
  }

  findByAdmin(adminId: Types.ObjectId) {
    return this.supportTicketModel
      .find({ admin: adminId })
      .populate({
        path: collectionsName.customer,
        select: 'firstName lastName customerType',
      })
      .sort({ createdAt: -1 })
      .lean<SupportTicket[]>();
  }

  findByCustomer(customerId: Types.ObjectId) {
    return this.supportTicketModel.find({ customer: customerId }).lean<SupportTicket[]>();
  }

  async closeSupportTicket(id: Types.ObjectId) {
    const data = await this.supportTicketModel
      .findByIdAndUpdate(id, { $set: { status: SUPPORT_STATUS.CLOSED } })
      .populate({
        path: 'customer',
        select: 'firstName lastName customerType',
      })
      .lean<SupportTicket>();

    const customer = await this.customerModel
      .findById(data.customer)
      .select('firstName lastName email')
      .lean<Customer>();

    //send email for re-open file
    this.emailQueueProducers.sendMail({
      receiver: customer.email,
      name: customer.firstName + ' ' + customer.lastName,
      emailType: EMAIL_TYPE.closedSupportTicket,
      uniqueId: data.ticketId,
    });

    return data;
  }

  async remove(id: Types.ObjectId) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const supportTicket = await this.supportTicketModel.findByIdAndDelete(id).lean<SupportTicket>();

      await this.chatModel.deleteMany(
        { service: supportTicket._id, chatBelong: CHAT_BELONG.SUPPORT_TICKET },
        { session },
      );

      if (supportTicket.file) {
        await this.storageService.delete(supportTicket._id.toString(), supportTicket.file.key);
      }

      await session.commitTransaction();
      return supportTicket;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

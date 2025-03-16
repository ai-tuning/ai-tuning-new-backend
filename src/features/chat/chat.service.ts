import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CHAT_BELONG, collectionsName, EMAIL_TYPE, FILE_SERVICE_STATUS, SUPPORT_STATUS } from '../constant';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { Chat } from './schema/chat.schema';
import { StorageService } from '../storage-service/storage-service.service';
import { existsSync, unlinkSync } from 'fs';
import { FileService } from '../file-service/schema/file-service.schema';
import { SupportTicket } from '../support-ticket/schema/support-ticket.schema';
import { EmailQueueProducers } from '../queue-manager/producers/email-queue.producers';
import { Customer } from '../customer/schema/customer.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(collectionsName.chat) private readonly chatModel: Model<Chat>,
    @InjectModel(collectionsName.fileService) private readonly fileServiceModal: Model<FileService>,
    @InjectModel(collectionsName.supportTicket) private readonly supportTicketModel: Model<SupportTicket>,
    @InjectModel(collectionsName.customer) private readonly customerModel: Model<Customer>,
    private readonly storageService: StorageService,
    @InjectConnection() private readonly connection: Connection,
    private readonly emailQueueProducers: EmailQueueProducers,
  ) {}

  async create(createChatDto: CreateChatDto, file?: Express.Multer.File, sessionParams?: ClientSession) {
    let isUploaded = false;
    let fileServiceUniqueId = '';
    let ticketUniqueId = '';

    const session = sessionParams || (await this.connection.startSession());

    try {
      if (!sessionParams) {
        session.startTransaction();
      }
      const chat = new this.chatModel(createChatDto);

      if (chat.chatBelong === CHAT_BELONG.FILE_SERVICE) {
        const fileService = await this.fileServiceModal
          .findById(chat.service)
          .select('status uniqueId')
          .session(session);
        if (
          fileService &&
          (fileService.status === FILE_SERVICE_STATUS.CLOSED || fileService.status === FILE_SERVICE_STATUS.COMPLETED)
        ) {
          await this.fileServiceModal.findByIdAndUpdate(
            chat.service,
            { status: FILE_SERVICE_STATUS.OPEN },
            { session },
          );
          fileServiceUniqueId = fileService.uniqueId.toString();
        }
      }

      if (chat.chatBelong === CHAT_BELONG.SUPPORT_TICKET) {
        const supportTicket = await this.supportTicketModel
          .findById(chat.service)
          .select('status ticketId')
          .session(session);
        if (supportTicket.status === SUPPORT_STATUS.CLOSED) {
          await this.supportTicketModel.findByIdAndUpdate(chat.service, { status: SUPPORT_STATUS.OPEN }, { session });
          ticketUniqueId = supportTicket.ticketId;
        }
      }

      if (file) {
        const uploadedFile = await this.storageService.upload(createChatDto.service.toString(), {
          name: file.filename,
          path: file.path,
        });
        chat.file = {
          originalname: file.originalname,
          uniqueName: file.filename,
          key: uploadedFile,
        };
        chat.mimeType = file.mimetype;
        isUploaded = true;
      }
      const newChat = await chat.save({ session });

      if (!sessionParams) {
        await session.commitTransaction();
        return newChat;
      }

      if (fileServiceUniqueId) {
        const customer = await this.customerModel.findById(createChatDto.customer);
        //send email for re-open file
        this.emailQueueProducers.sendMail({
          receiver: customer.email,
          name: customer.firstName + ' ' + customer.lastName,
          emailType: EMAIL_TYPE.reopenSupportTicket,
          uniqueId: fileServiceUniqueId,
        });
      }

      if (ticketUniqueId) {
        const customer = await this.customerModel.findById(createChatDto.customer);
        //send email for re-open file
        this.emailQueueProducers.sendMail({
          receiver: customer.email,
          name: customer.firstName + ' ' + customer.lastName,
          emailType: EMAIL_TYPE.reopenFileService,
          uniqueId: fileServiceUniqueId,
        });
      }

      return newChat;
    } catch (error) {
      if (!sessionParams) {
        await session.abortTransaction();
      }

      if (isUploaded) {
        await this.storageService.delete(createChatDto.service.toString(), file.filename);
      }
      throw error;
    } finally {
      if (file && existsSync(file.path)) {
        unlinkSync(file.path);
      }
      if (!sessionParams) {
        await session.endSession();
      }
    }
  }

  async findByFileService(id: Types.ObjectId) {
    const data = await this.chatModel
      .find({ service: id, chatBelong: CHAT_BELONG.FILE_SERVICE })
      .populate({
        path: collectionsName.customer,
        select: 'name',
        strictPopulate: false,
      })
      .lean<Chat[]>();
    return data;
  }
  async findBySupportId(id: Types.ObjectId) {
    const data = await this.chatModel
      .find({ service: id, chatBelong: CHAT_BELONG.SUPPORT_TICKET })
      .populate({
        path: collectionsName.customer,
        select: 'name',
        strictPopulate: false,
      })
      .lean<Chat[]>();
    return data;
  }

  async remove(id: Types.ObjectId) {
    const data = await this.chatModel.findByIdAndDelete(id).lean<Chat>();
    if (data.file) await this.storageService.delete(data.service.toString(), data.file.key);
    return data;
  }

  async deleteManyByFileServiceId(id: Types.ObjectId, session?: ClientSession) {
    const data = await this.chatModel
      .deleteMany({ service: id, chatBelong: CHAT_BELONG.FILE_SERVICE }, { session })
      .lean<Chat[]>();
    return data;
  }
}

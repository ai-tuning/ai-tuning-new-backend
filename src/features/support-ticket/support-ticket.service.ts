import { Injectable } from '@nestjs/common';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { SupportTicket } from './schema/support-ticket.schema';
import { Model, Types } from 'mongoose';
import { StorageService } from '../storage-service/storage-service.service';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class SupportTicketService {
  constructor(
    @InjectModel(collectionsName.supportTicket) private readonly supportTicketModel: Model<SupportTicket>,
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

  update(id: number, updateSupportTicketDto: UpdateSupportTicketDto) {
    return `This action updates a #${id} supportTicket`;
  }

  async remove(id: number) {
    const supportTicket = await this.supportTicketModel.findByIdAndDelete(id).lean<SupportTicket>();
    if (supportTicket.file) {
      await this.storageService.delete(supportTicket._id.toString(), supportTicket.file.key);
    }
  }
}

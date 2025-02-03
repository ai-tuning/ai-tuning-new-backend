import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { Invoice } from './schema/invoice.schema';

@Injectable()
export class InvoiceService {
  constructor(@InjectModel(collectionsName.invoice) private readonly invoiceModel: Model<Invoice>) {}

  create(createInvoiceDto: CreateInvoiceDto) {
    return 'This action adds a new invoice';
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceModel.find({}).lean<Invoice[]>();
  }

  async findByAdmin(adminId: Types.ObjectId): Promise<Invoice[]> {
    return this.invoiceModel.find({ admin: adminId }).lean<Invoice[]>();
  }

  async findByCustomer(customerId: Types.ObjectId): Promise<Invoice[]> {
    return this.invoiceModel.find({ customer: customerId }).lean<Invoice[]>();
  }
}

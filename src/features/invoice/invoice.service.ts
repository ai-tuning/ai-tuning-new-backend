import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ClientSession, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { Invoice } from './schema/invoice.schema';
import { CustomValidationPipe } from '../common/validation-helper/custom-validation-pipe';

@Injectable()
export class InvoiceService {
  constructor(@InjectModel(collectionsName.invoice) private readonly invoiceModel: Model<Invoice>) {}

  async create(createInvoiceDto: CreateInvoiceDto, session: ClientSession) {
    await CustomValidationPipe([createInvoiceDto], CreateInvoiceDto);

    const createdInvoice = new this.invoiceModel(createInvoiceDto);
    return await createdInvoice.save({ session });
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceModel.find({}).lean<Invoice[]>();
  }

  async findByAdmin(adminId: Types.ObjectId): Promise<Invoice[]> {
    return this.invoiceModel.find({ admin: adminId }).lean<Invoice[]>();
  }

  async findByCustomer(customerId: Types.ObjectId): Promise<Invoice[]> {
    return this.invoiceModel
      .find({ customer: customerId })
      .populate({
        path: 'customer',
        select: 'firstName lastName email phone country city address postcode state companyName ',
      })
      .lean<Invoice[]>();
  }

  async findById(id: Types.ObjectId): Promise<Invoice> {
    return this.invoiceModel.findById(id);
  }
}

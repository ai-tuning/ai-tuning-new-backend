import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { PAYMENT_STATUS } from 'src/features/constant';

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  customer: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  invoiceNumber: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  unitPrice: number;

  @IsNotEmpty()
  @IsNumber()
  totalPrice: number;

  @IsNotEmpty()
  @IsNumber()
  vat: number;

  @IsNotEmpty()
  @IsNumber()
  grandTotal: number;
}

import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  customer?: Types.ObjectId;

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

  vatRate?: number;

  customerVatNumber?: string;

  adminVatNumber?: string;

  @IsNotEmpty()
  @IsNumber()
  grandTotal: number;

  reverseCharge: boolean;

  isEvcCredit: boolean;
}

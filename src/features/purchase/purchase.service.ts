import { BadRequestException, Injectable } from '@nestjs/common';
import { CredentialService } from '../credential/credential.service';
import { Connection, Types } from 'mongoose';
import { PurchaseCreditDto } from './dto/purchase-credit.dto';
import { InvoiceService } from '../invoice/invoice.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateInvoiceDto } from '../invoice/dto/create-invoice.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { PAYMENT_STATUS } from '../constant';
import { CustomerService } from '../customer/customer.service';
import { PurchaseAdminCreditDto } from './dto/purchase-admin-credit.dto';
import { AdminService } from '../admin/admin.service';
import { AdminPricingService } from '../admin-pricing/admin-pricing.service';

@Injectable()
export class PurchaseService {
  private paypal_url: string;

  private returnUrl: string;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly httpService: HttpService,
    private readonly credentialService: CredentialService,
    private readonly invoiceService: InvoiceService,
    private readonly pricingService: PricingService,
    private readonly customerService: CustomerService,
    private readonly adminService: AdminService,
    private readonly adminPricingService: AdminPricingService,
  ) {
    this.paypal_url = process.env.PAYPAL_URL;
    this.returnUrl = process.env.PAYPAL_RETURN_URL;
  }

  async purchaseCredits(adminId: Types.ObjectId, purchaseCreditDto: PurchaseCreditDto, origin: string) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const pricing = await this.pricingService.findCreditPricingByAdminId(adminId);
      const unitPrice = pricing.creditPrice;

      const totalPrice = unitPrice * purchaseCreditDto.quantity;
      const vat = 0;
      const grandTotal = totalPrice;

      const invoiceDto: CreateInvoiceDto = {
        admin: adminId,
        customer: purchaseCreditDto.customer,
        invoiceNumber: Date.now().toString(),
        description: 'Software Development Credits',
        quantity: purchaseCreditDto.quantity,
        unitPrice: unitPrice,
        totalPrice,
        vat,
        grandTotal,
      };

      //create invoice
      const invoice = await this.invoiceService.create(invoiceDto, session);

      //generate payment link
      const order = await this.createOrder(adminId, invoice._id as Types.ObjectId, totalPrice, origin);

      await session.commitTransaction();
      return order.links[1].href;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async verifyAndSaveCredits(invoiceId: Types.ObjectId, orderId: string) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const invoice = await this.invoiceService.findById(invoiceId);

      let adminId = invoice.admin;
      if (!invoice.customer) {
        //if the customer not exist then it's admin purchase so we have to use super admin credential
        adminId = new Types.ObjectId(process.env.SUPER_ADMIN_ID);
      }
      const capturedOrder = await this.captureOrder(adminId, orderId);

      if (capturedOrder.status === 'COMPLETED') {
        invoice.status = PAYMENT_STATUS.PAID;
        invoice.orderId = orderId;
        await invoice.save({ session });

        if (invoice.customer) {
          //save customer credit
          await this.customerService.updateCredit(invoice.customer, invoice.quantity, session);
        } else {
          await this.adminService.updateCredit(invoice.admin, invoice.quantity, session);
        }
      } else {
        return false;
      }
      await session.commitTransaction();
      return invoice;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Generate access token
   * @returns access token
   */
  async getAccessToken(adminId: Types.ObjectId) {
    const getCredential = await this.credentialService.findByAdmin(adminId, 'paypal');
    // Encode the credentials in Base64 for Basic Authentication

    if (!getCredential.paypal) throw new BadRequestException('Paypal Credential not found');

    const credentials = btoa(`${getCredential.paypal.clientId}:${getCredential.paypal.clientSecret}`);

    try {
      const { data } = await this.httpService.axiosRef(`${this.paypal_url}/v1/oauth2/token`, {
        method: 'post',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: 'grant_type=client_credentials',
      });
      return data.access_token;
    } catch (error) {
      console.error('Request failed:', error);
    }
  }

  /**
   *
   * @param {Types.ObjectId} adminId
   * @param {Types.ObjectId} invoiceId
   * @param {number} amount
   * @returns object with payment link
   */
  async createOrder(adminId: Types.ObjectId, invoiceId: Types.ObjectId, amount: number, origin: string) {
    const token = await this.getAccessToken(adminId);
    console.log(decodeURIComponent(origin));
    const { data } = await this.httpService.axiosRef(`${this.paypal_url}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PayPal-Request-Id': Date.now().toString(), //generate random id,
        Authorization: `Bearer ${token}`,
      },
      data: {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: invoiceId.toString(),
            amount: {
              currency_code: 'EUR',
              value: amount,
              breakdown: {
                item_total: { currency_code: 'EUR', value: amount },
              },
            },
            items: [
              {
                name: 'Software Development Credits',
                unit_amount: { currency_code: 'EUR', value: amount },
                quantity: '1',
              },
            ],
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              brand_name: 'AI_TUNED',
              locale: 'en-US',
              landing_page: 'LOGIN',
              user_action: 'PAY_NOW',
              return_url: `${this.returnUrl}?invoiceId=${invoiceId}&origin=${origin}`,
              cancel_url: `${decodeURIComponent(origin)}/payment/cancel`,
            },
          },
        },
      },
    });
    return data;
  }

  /**
   * Capture an order for verify the payment payment will not completed without capture
   * @param {string} orderId
   * @returns
   */
  async captureOrder(adminId: Types.ObjectId, orderId: string) {
    const token = await this.getAccessToken(adminId);
    const { data } = await this.httpService.axiosRef(`${this.paypal_url}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PayPal-Request-Id': Date.now().toString(),
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  }

  //=================admin credit purchase service=================================
  async purchaseAdminCredits(adminId: Types.ObjectId, purchaseCreditDto: PurchaseAdminCreditDto, origin: string) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const adminCreditPricing = await this.adminPricingService.getAdminAllPricing();
      const unitPrice = adminCreditPricing.creditPrice;

      const totalPrice = unitPrice * purchaseCreditDto.quantity;
      const vat = 0;
      const grandTotal = totalPrice;

      const invoiceDto: CreateInvoiceDto = {
        admin: adminId,
        invoiceNumber: Date.now().toString(),
        description: 'Software Development Credits',
        quantity: purchaseCreditDto.quantity,
        unitPrice: unitPrice,
        totalPrice,
        vat,
        grandTotal,
      };

      //create invoice
      const invoice = await this.invoiceService.create(invoiceDto, session);
      const superAdminId = new Types.ObjectId(process.env.SUPER_ADMIN_ID);
      //generate payment link
      const order = await this.createOrder(superAdminId, invoice._id as Types.ObjectId, totalPrice, origin);

      await session.commitTransaction();
      return order.links[1].href;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

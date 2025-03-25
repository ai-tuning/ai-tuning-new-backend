import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import { CountryCodes } from 'validate-vat-ts';
import { EvcService } from '../evc/evc.service';

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
        private readonly evcService: EvcService,
    ) {
        this.paypal_url = process.env.PAYPAL_URL;
        this.returnUrl = process.env.PAYPAL_RETURN_URL;
    }

    async purchaseCredits(adminId: Types.ObjectId, purchaseCreditDto: PurchaseCreditDto, origin: string) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();

            const admin = await this.adminService.findByIdAndSelect(adminId, ['vatNumber', 'vatRate', 'country']);

            if (!admin) {
                throw new BadRequestException('Invalid Admin');
            }

            if (this.adminService.isEuCountry(admin.country) && admin.vatNumber) {
                //validate admin vat
                const vatDetails = await this.adminService.validateVatNumber(
                    admin.country as CountryCodes,
                    admin.vatNumber,
                );
                if (!vatDetails.valid) {
                    throw new BadRequestException('Invalid Admin VAT Number');
                }
            }

            //validate customer vat
            const customer = await this.customerService.findByIdAndSelect(purchaseCreditDto.customer, [
                'vatNumber',
                'country',
                'evcNumber',
                'customerType',
            ]);

            if (!customer) {
                throw new BadRequestException('Invalid Customer');
            }

            if (purchaseCreditDto.isEvcCredit && !customer.evcNumber) {
                throw new BadRequestException('You does not have EVC Number');
            }

            // check evc number validity
            if (purchaseCreditDto.isEvcCredit && customer.evcNumber) {
                const isValidEvc = await this.evcService.isInvalidNumber(adminId, customer.evcNumber);
                if (isValidEvc) {
                    throw new BadRequestException('Invalid EVC Number');
                }
            }

            if (this.customerService.isEuCountry(customer.country as CountryCodes) && customer.vatNumber) {
                const customerVatDetails = await this.customerService.validateVatNumber(
                    customer.country as CountryCodes,
                    customer.vatNumber,
                );

                if (!customerVatDetails.valid) {
                    throw new BadRequestException('Invalid Customer VAT Number');
                }
            }

            const pricing = await this.pricingService.findCreditPricingByAdminId(adminId);
            let unitPrice = pricing.creditPrice;
            if (purchaseCreditDto.isEvcCredit) {
                const findPrice = pricing.evcPrices.find(
                    (item) => item.customerType._id.toString() === customer.customerType.toString(),
                );

                if (!findPrice) {
                    throw new NotFoundException('Customer EVC price in not found');
                }
                unitPrice = findPrice.price;
            }

            const {
                totalPrice,
                vatAmount,
                grandTotal,
                reverseCharge = false,
            } = this.calculateVat(
                {
                    vatRate: admin.vatRate,
                    country: admin.country,
                },
                {
                    country: customer.country,
                    vatNumber: customer.vatNumber,
                },
                unitPrice * purchaseCreditDto.quantity,
            );

            console.log({ totalPrice, vatAmount, grandTotal, reverseCharge });

            let description = purchaseCreditDto.isEvcCredit
                ? 'Software Development EVC Credits'
                : 'Software Development Credits';

            const invoiceDto: CreateInvoiceDto = {
                admin: adminId,
                customer: purchaseCreditDto.customer,
                invoiceNumber: Date.now().toString(),
                description,
                quantity: purchaseCreditDto.quantity,
                unitPrice: unitPrice,
                totalPrice,
                vat: vatAmount,
                grandTotal,
                reverseCharge,
                vatRate: admin.vatRate,
                isEvcCredit: purchaseCreditDto.isEvcCredit,
            };

            if (customer.vatNumber) {
                invoiceDto.customerVatNumber = customer.vatNumber;
            }

            if (admin.vatNumber) {
                invoiceDto.adminVatNumber = admin.vatNumber;
            }

            //create invoice
            const invoice = await this.invoiceService.create(invoiceDto, session);

            //generate payment link
            const order = await this.createOrder(
                adminId,
                invoice._id as Types.ObjectId,
                totalPrice,
                origin,
                description,
            );

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

                if (invoice.isEvcCredit) {
                    const customer = await this.customerService.findByIdAndSelect(invoice.customer, ['evcNumber']);
                    await this.evcService.addEvcBalance(adminId, customer.evcNumber, invoice.quantity);
                } else {
                    if (invoice.customer) {
                        //save customer credit
                        await this.customerService.updateCredit(invoice.customer, invoice.quantity, session);
                    } else {
                        await this.adminService.updateCredit(invoice.admin, invoice.quantity, session);
                    }
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
    async createOrder(
        adminId: Types.ObjectId,
        invoiceId: Types.ObjectId,
        amount: number,
        origin: string,
        itemName: string,
    ) {
        const token = await this.getAccessToken(adminId);
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
                                name: itemName,
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
                reverseCharge: false,
                isEvcCredit: false,
            };

            //create invoice
            const invoice = await this.invoiceService.create(invoiceDto, session);
            const superAdminId = new Types.ObjectId(process.env.SUPER_ADMIN_ID);
            //generate payment link
            const order = await this.createOrder(
                superAdminId,
                invoice._id as Types.ObjectId,
                totalPrice,
                origin,
                'Software Development Credits',
            );

            await session.commitTransaction();
            return order.links[1].href;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    //calculate vat and prices
    calculateVat(
        vatDetails: { country: string; vatRate: number },
        user: { country: string; vatNumber: string },
        price: number, //total price of something
    ) {
        if (!vatDetails.vatRate) {
            return { totalPrice: price, vatAmount: 0, grandTotal: price }; // No VAT details, no VAT
        }

        const buyerCountry = user.country;
        const sellerCountry = vatDetails.country;
        const buyerVatNumber = user.vatNumber;
        const vatRate = vatDetails.vatRate / 100;

        // console.log(buyerCountry, sellerCountry, buyerVatNumber, vatRate);

        const buyerIsEU = this.adminService.isEuCountry(buyerCountry);
        const sellerIsEU = this.adminService.isEuCountry(sellerCountry);

        if (buyerIsEU && sellerIsEU) {
            // EU to EU
            if (sellerCountry === buyerCountry) {
                // Same country: Always add VAT
                const vatAmount = price * vatRate;
                const grandTotal = price + vatAmount;
                return { totalPrice: price, vatAmount: vatAmount, grandTotal };
            } else {
                // Different EU countries
                if (buyerVatNumber) {
                    // Valid VAT number: Reverse charge
                    return { totalPrice: price, vatAmount: 0, grandTotal: price, reverseCharge: true };
                } else {
                    // No or invalid VAT number: Add VAT
                    const vatAmount = price * vatRate;
                    const grandTotal = price + vatAmount;
                    return { totalPrice: price, vatAmount: vatAmount, grandTotal };
                }
            }
        } else {
            // Non-EU or mixed EU/non-EU: Normal VAT calculation
            const vatAmount = price * vatRate;
            const grandTotal = price + vatAmount;
            return { totalPrice: price, vatAmount: vatAmount, grandTotal: grandTotal };
        }
    }
}

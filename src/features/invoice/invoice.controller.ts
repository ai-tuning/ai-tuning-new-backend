import { Controller, Get } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { AccessRole, IAuthUser } from '../common';
import { RolesEnum } from '../constant';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @AccessRole([RolesEnum.SUPER_ADMIN])
  @Get()
  async findAll() {
    return await this.invoiceService.findAll();
  }

  @AccessRole([RolesEnum.ADMIN, RolesEnum.SUPER_ADMIN])
  @Get('admin')
  async findByAdmin(@AuthUser() authUser: IAuthUser) {
    return await this.invoiceService.findByAdmin(authUser.admin);
  }

  @AccessRole([RolesEnum.ADMIN, RolesEnum.SUPER_ADMIN])
  @Get('admin-purchase')
  async purchaseInvoice(@AuthUser() authUser: IAuthUser) {
    return await this.invoiceService.findAdminPurchaseInvoice(authUser.admin);
  }

  @AccessRole([RolesEnum.SUPER_ADMIN])
  @Get('admin-invoices')
  async adminsInvoices() {
    return await this.invoiceService.findAdminsInvoices();
  }

  @AccessRole([RolesEnum.CUSTOMER])
  @Get('customer')
  async findByCustomer(@AuthUser() authUser: IAuthUser) {
    return await this.invoiceService.findByCustomer(authUser.customer);
  }
}

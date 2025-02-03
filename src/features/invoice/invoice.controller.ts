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
  findAll() {
    return this.invoiceService.findAll();
  }

  @AccessRole([RolesEnum.ADMIN, RolesEnum.SUPER_ADMIN])
  @Get('admin')
  findByAdmin(@AuthUser() authUser: IAuthUser) {
    return this.invoiceService.findByAdmin(authUser.admin);
  }

  @AccessRole([RolesEnum.CUSTOMER])
  @Get('customer')
  findByCustomer(@AuthUser() authUser: IAuthUser) {
    return this.invoiceService.findByCustomer(authUser.customer);
  }
}

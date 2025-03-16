import { Types } from 'mongoose';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { SupportTicketService } from './support-ticket.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { AccessRole, IAuthUser } from '../common';
import { RolesEnum } from '../constant';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('support-tickets')
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  @UseInterceptors(FileInterceptor('file'))
  @Post()
  async create(@Body() createSupportTicketDto: CreateSupportTicketDto, @UploadedFile() file: Express.Multer.File) {
    const data = await this.supportTicketService.create(createSupportTicketDto, file);
    return { data, message: 'Support Ticket Created Successfully' };
  }

  @AccessRole([RolesEnum.SUPER_ADMIN])
  @Get()
  findAll() {
    return this.supportTicketService.findAll();
  }

  @AccessRole([RolesEnum.ADMIN, RolesEnum.SUPER_ADMIN])
  @Get('admin')
  findByAdmin(@AuthUser() authUser: IAuthUser) {
    return this.supportTicketService.findByAdmin(authUser.admin);
  }

  @AccessRole([RolesEnum.CUSTOMER])
  @Get('customer')
  findByCustomer(@AuthUser() authUser: IAuthUser) {
    return this.supportTicketService.findByCustomer(authUser.customer);
  }

  @Get('close/:ticketId')
  async closeSupportTicket(@Param('ticketId') ticketId: Types.ObjectId) {
    const data = await this.supportTicketService.closeSupportTicket(ticketId);
    return { data, message: 'Support Ticket Closed Successfully' };
  }

  @Delete(':ticketId')
  async remove(@Param('ticketId') ticketId: Types.ObjectId) {
    const data = await this.supportTicketService.remove(ticketId);
    return { data, message: 'Support Ticket Deleted Successfully' };
  }
}

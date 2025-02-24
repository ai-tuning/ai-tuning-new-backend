import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Types } from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccessRole } from '../common';
import { RolesEnum } from '../constant';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseInterceptors(FileInterceptor('file'))
  @AccessRole([RolesEnum.ADMIN, RolesEnum.SUPER_ADMIN, RolesEnum.CUSTOMER])
  @Post('message')
  async createCustomerChat(@Body() createChatDto: CreateChatDto, @UploadedFile() file: Express.Multer.File) {
    console.log('createChatDto', createChatDto);
    const data = await this.chatService.create(createChatDto, file);
    return { data };
  }

  @Get('file-service/:fileserviceId')
  findByFileService(@Param('fileserviceId') fileserviceId: Types.ObjectId) {
    return this.chatService.findByFileService(fileserviceId);
  }

  @Get('support-ticket/:ticketId')
  findByTicketId(@Param('ticketId') ticketId: Types.ObjectId) {
    return this.chatService.findBySupportId(ticketId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto) {
    return this.chatService.update(+id, updateChatDto);
  }

  @Delete('message/:id')
  async remove(@Param('id') id: Types.ObjectId) {
    const data = await this.chatService.remove(id);
    return { data, message: 'Message deleted successfully' };
  }
}

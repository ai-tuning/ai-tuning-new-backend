import { Controller, Get, Post, Body, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { Types } from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseInterceptors(FileInterceptor('file'))
  @Post('message')
  async sendMessage(@Body() createChatDto: CreateChatDto, @UploadedFile() file: Express.Multer.File) {
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

  @Delete('message/:id')
  async remove(@Param('id') id: Types.ObjectId) {
    const data = await this.chatService.remove(id);
    return { data, message: 'Message deleted successfully' };
  }
}

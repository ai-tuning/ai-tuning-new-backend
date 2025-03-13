import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { InjectModel } from '@nestjs/mongoose';
import { CHAT_BELONG, collectionsName } from '../constant';
import { ClientSession, Model, Types } from 'mongoose';
import { Chat } from './schema/chat.schema';
import { StorageService } from '../storage-service/storage-service.service';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(collectionsName.chat) private readonly chatModel: Model<Chat>,
    private readonly storageService: StorageService,
  ) {}

  async create(createChatDto: CreateChatDto, file?: Express.Multer.File, session?: ClientSession) {
    let isUploaded = false;
    try {
      const chat = new this.chatModel(createChatDto);
      if (file) {
        const uploadedFile = await this.storageService.upload(createChatDto.service.toString(), {
          name: file.filename,
          path: file.path,
        });
        chat.file = {
          originalname: file.originalname,
          uniqueName: file.filename,
          key: uploadedFile,
        };
        chat.mimeType = file.mimetype;
        isUploaded = true;
      }
      if (session) return chat.save({ session });
      return chat.save();
    } catch (error) {
      if (isUploaded) {
        await this.storageService.delete(createChatDto.service.toString(), file.filename);
      }
      throw error;
    } finally {
      if (file && existsSync(file.path)) {
        unlinkSync(file.path);
      }
    }
  }

  async findByFileService(id: Types.ObjectId) {
    const data = await this.chatModel
      .find({ service: id, chatBelong: CHAT_BELONG.FILE_SERVICE })
      .populate({
        path: collectionsName.customer,
        select: 'name',
        strictPopulate: false,
      })
      .lean<Chat[]>();
    return data;
  }
  async findBySupportId(id: Types.ObjectId) {
    const data = await this.chatModel
      .find({ service: id, chatBelong: CHAT_BELONG.SUPPORT_TICKET })
      .populate({
        path: collectionsName.customer,
        select: 'name',
        strictPopulate: false,
      })
      .lean<Chat[]>();
    return data;
  }

  findOne(id: number) {
    return `This action returns a #${id} chat`;
  }

  update(id: number, updateChatDto: UpdateChatDto) {
    return `This action updates a #${id} chat`;
  }

  async remove(id: Types.ObjectId) {
    const data = await this.chatModel.findByIdAndDelete(id).lean<Chat>();
    if (data.file) await this.storageService.delete(data.service.toString(), data.file.key);
    return data;
  }
}

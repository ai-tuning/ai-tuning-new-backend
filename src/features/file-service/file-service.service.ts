import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { FileService } from './schema/file-service.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class FileServiceService {
  constructor(@InjectModel(collectionsName.fileService) private readonly fileServiceModel: Model<FileService>) {}

  async findById(id: Types.ObjectId): Promise<FileService> {
    return this.fileServiceModel.findById(id).lean<FileService>();
  }
}

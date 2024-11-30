import { Injectable } from '@nestjs/common';
import { CreateFileServiceDto } from './dto/create-file-service.dto';
import { UpdateFileServiceDto } from './dto/update-file-service.dto';

@Injectable()
export class FileServiceService {
  create(createFileServiceDto: CreateFileServiceDto) {
    return 'This action adds a new fileService';
  }

  findAll() {
    return `This action returns all fileService`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fileService`;
  }

  update(id: number, updateFileServiceDto: UpdateFileServiceDto) {
    return `This action updates a #${id} fileService`;
  }

  remove(id: number) {
    return `This action removes a #${id} fileService`;
  }
}

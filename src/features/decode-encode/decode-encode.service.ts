import { Injectable } from '@nestjs/common';
import { CreateDecodeEncodeDto } from './dto/create-decode-encode.dto';
import { UpdateDecodeEncodeDto } from './dto/update-decode-encode.dto';

@Injectable()
export class DecodeEncodeService {
  create(createDecodeEncodeDto: CreateDecodeEncodeDto) {
    return 'This action adds a new decodeEncode';
  }

  findAll() {
    return `This action returns all decodeEncode`;
  }

  findOne(id: number) {
    return `This action returns a #${id} decodeEncode`;
  }

  update(id: number, updateDecodeEncodeDto: UpdateDecodeEncodeDto) {
    return `This action updates a #${id} decodeEncode`;
  }

  remove(id: number) {
    return `This action removes a #${id} decodeEncode`;
  }
}

import { Injectable } from '@nestjs/common';
import { CreateDtcDto } from './dto/create-dtc.dto';
import { UpdateDtcDto } from './dto/update-dtc.dto';

@Injectable()
export class DtcService {
  create(createDtcDto: CreateDtcDto) {
    return 'This action adds a new dtc';
  }

  findAll() {
    return `This action returns all dtc`;
  }

  findOne(id: number) {
    return `This action returns a #${id} dtc`;
  }

  update(id: number, updateDtcDto: UpdateDtcDto) {
    return `This action updates a #${id} dtc`;
  }

  remove(id: number) {
    return `This action removes a #${id} dtc`;
  }
}

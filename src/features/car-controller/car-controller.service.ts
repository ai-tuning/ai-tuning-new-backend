import { Injectable } from '@nestjs/common';
import { CreateCarControllerDto } from './dto/create-car-controller.dto';
import { UpdateCarControllerDto } from './dto/update-car-controller.dto';

@Injectable()
export class CarControllerService {
  create(createCarControllerDto: CreateCarControllerDto) {
    return 'This action adds a new carController';
  }

  findAll() {
    return `This action returns all carController`;
  }

  findOne(id: number) {
    return `This action returns a #${id} carController`;
  }

  update(id: number, updateCarControllerDto: UpdateCarControllerDto) {
    return `This action updates a #${id} carController`;
  }

  remove(id: number) {
    return `This action removes a #${id} carController`;
  }
}

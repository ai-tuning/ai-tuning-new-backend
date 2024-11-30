import { PartialType } from '@nestjs/swagger';
import { CreateCarControllerDto } from './create-car-controller.dto';

export class UpdateCarControllerDto extends PartialType(CreateCarControllerDto) {}

import { PartialType } from '@nestjs/swagger';
import { CreateDtcDto } from './create-dtc.dto';

export class UpdateDtcDto extends PartialType(CreateDtcDto) {}

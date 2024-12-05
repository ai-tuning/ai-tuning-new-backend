import { PartialType } from '@nestjs/swagger';
import { CreateEvcDto } from './create-evc.dto';

export class UpdateEvcDto extends PartialType(CreateEvcDto) {}

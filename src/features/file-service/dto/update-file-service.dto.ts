import { PartialType } from '@nestjs/swagger';
import { CreateFileServiceDto } from './create-file-service.dto';

export class UpdateFileServiceDto extends PartialType(CreateFileServiceDto) {}

import { PartialType } from '@nestjs/swagger';
import { CreateDecodeEncodeDto } from './create-decode-encode.dto';

export class UpdateDecodeEncodeDto extends PartialType(CreateDecodeEncodeDto) {}

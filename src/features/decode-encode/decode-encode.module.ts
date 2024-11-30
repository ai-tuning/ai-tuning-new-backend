import { Module } from '@nestjs/common';
import { DecodeEncodeService } from './decode-encode.service';
import { DecodeEncodeController } from './decode-encode.controller';

@Module({
  controllers: [DecodeEncodeController],
  providers: [DecodeEncodeService],
})
export class DecodeEncodeModule {}

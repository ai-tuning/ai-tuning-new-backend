import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DecodeEncodeService } from './decode-encode.service';
import { CreateDecodeEncodeDto } from './dto/create-decode-encode.dto';
import { UpdateDecodeEncodeDto } from './dto/update-decode-encode.dto';

@Controller('decode-encode')
export class DecodeEncodeController {
  constructor(private readonly decodeEncodeService: DecodeEncodeService) {}

  @Post()
  create(@Body() createDecodeEncodeDto: CreateDecodeEncodeDto) {
    return this.decodeEncodeService.create(createDecodeEncodeDto);
  }

  @Get()
  findAll() {
    return this.decodeEncodeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.decodeEncodeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDecodeEncodeDto: UpdateDecodeEncodeDto) {
    return this.decodeEncodeService.update(+id, updateDecodeEncodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.decodeEncodeService.remove(+id);
  }
}

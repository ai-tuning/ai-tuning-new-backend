import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DtcService } from './dtc.service';
import { CreateDtcDto } from './dto/create-dtc.dto';
import { UpdateDtcDto } from './dto/update-dtc.dto';

@Controller('dtc')
export class DtcController {
  constructor(private readonly dtcService: DtcService) {}

  @Post()
  create(@Body() createDtcDto: CreateDtcDto) {
    return this.dtcService.create(createDtcDto);
  }

  @Get()
  findAll() {
    return this.dtcService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dtcService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDtcDto: UpdateDtcDto) {
    return this.dtcService.update(+id, updateDtcDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dtcService.remove(+id);
  }
}

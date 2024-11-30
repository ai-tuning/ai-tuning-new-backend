import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FileServiceService } from './file-service.service';
import { CreateFileServiceDto } from './dto/create-file-service.dto';
import { UpdateFileServiceDto } from './dto/update-file-service.dto';

@Controller('file-service')
export class FileServiceController {
  constructor(private readonly fileServiceService: FileServiceService) {}

  @Post()
  create(@Body() createFileServiceDto: CreateFileServiceDto) {
    return this.fileServiceService.create(createFileServiceDto);
  }

  @Get()
  findAll() {
    return this.fileServiceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fileServiceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFileServiceDto: UpdateFileServiceDto) {
    return this.fileServiceService.update(+id, updateFileServiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fileServiceService.remove(+id);
  }
}

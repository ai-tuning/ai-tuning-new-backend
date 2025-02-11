import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AutomatisationDto } from './dto/create-file-service.dto';
import { FileServiceService } from './file-service.service';

@Controller('file-services')
export class FileServiceController {
  constructor(private readonly fileServiceService: FileServiceService) {}

  @UseInterceptors(FileInterceptor('file'))
  @Post('automatisation')
  async automatisation(@Body() automatisationDto: AutomatisationDto, @UploadedFile() file: Express.Multer.File) {
    return this.fileServiceService.automatisation(automatisationDto, file);
  }
}

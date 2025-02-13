import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AutomatisationDto } from './dto/create-file-service.dto';
import { FileServiceService } from './file-service.service';
import { PrepareSolutionDto } from './dto/prepare-solution.dto';
import { Types } from 'mongoose';

@Controller('file-services')
export class FileServiceController {
  constructor(private readonly fileServiceService: FileServiceService) {}

  @Get('customers/:customerId')
  async findByCustomer(@Param('customerId') customerId: Types.ObjectId) {
    return this.fileServiceService.findByCustomerId(customerId);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('automatisation')
  async automatisation(@Body() automatisationDto: AutomatisationDto, @UploadedFile() file: Express.Multer.File) {
    return this.fileServiceService.automatisation(automatisationDto, file);
  }

  @Post('prepare-solution')
  async prepareSolution(@Body() prepareSolutionDto: PrepareSolutionDto) {
    const data = await this.fileServiceService.prepareSolution(prepareSolutionDto);
    return { data, message: 'Your request is submitted successfully' };
  }
}

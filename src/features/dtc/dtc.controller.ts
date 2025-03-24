import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile, Delete } from '@nestjs/common';
import { DtcService } from './dtc.service';
import { CreateDtcDto } from './dto/create-dtc.dto';
import { Types } from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('dtc')
export class DtcController {
    constructor(private readonly dtcService: DtcService) {}

    @UseInterceptors(FileInterceptor('file'))
    @Post()
    async create(@Body() createDtcDto: CreateDtcDto, @UploadedFile() file: Express.Multer.File) {
        const dtc = await this.dtcService.create(createDtcDto, file);
        return { data: dtc, message: 'File is uploaded, please wait while processing' };
    }

    @Get('admin')
    findAll() {
        return this.dtcService.findAll();
    }

    @Get('customer/:id')
    findByCustomer(@Param('id') id: Types.ObjectId) {
        return this.dtcService.findByCustomer(id);
    }

    @Delete('/:id')
    async deleteById(@Param('id') id: Types.ObjectId) {
        const data = await this.dtcService.deleteDtc(id);
        return { data, message: 'Dtc file is deleted' };
    }
}

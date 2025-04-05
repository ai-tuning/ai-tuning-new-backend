import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { DecodeEncodeService } from './decode-encode.service';
import { DecodeDto } from './dto/decode.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('decode-encode')
export class DecodeEncodeController {
    constructor(private readonly decodeEncodeService: DecodeEncodeService) {}

    @UseInterceptors(FileInterceptor('file'))
    @Post('decode')
    async decodeSlave(@Body() decodeDto: DecodeDto, @UploadedFile() file: Express.Multer.File) {
        const data = await this.decodeEncodeService.decodeSlave(decodeDto, file);
        return { data, message: 'File is decoded, keep the id for further processing' };
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post('encode')
    async encodeMod(@Body() body: { uniqueId: string }, @UploadedFile() file: Express.Multer.File) {
        console.log('body', body);
        const data = await this.decodeEncodeService.encodeMod(body.uniqueId, file);
        return { data, message: 'File is encrypted and ready for download' };
    }
}

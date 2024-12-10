import { Body, Controller, Delete, Get, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { StorageServiceService } from './storage-service.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../common';
import { Response } from 'express';
import { DIRECTORY_NAMES } from '../constant';

@Controller('storage-service')
export class StorageServiceController {
  constructor(private readonly storageServiceService: StorageServiceService) {}

  @Public()
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 1024 * 1024 * 2 },
      dest: 'public/uploads/images',
    }),
  )
  @Post('upload')
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
    const data = await this.storageServiceService.upload(
      file.path,
      { name: file.originalname, size: file.size },
      { child: 'customer1', parent: DIRECTORY_NAMES.FILES },
    );
    return data;
  }

  @Public()
  @Get('download')
  async downloadFile(@Res() res: Response, @Body() links: { link: string }) {
    console.log(links);
    const data = await this.storageServiceService.download(
      'https://mega.nz/file/H7hUlKhR#4D5vxr9zTfFblLxqiA9Kqaf3ko-1KBO301kwcAguPiA',
    );
    res.setHeader('Content-Type', 'image/jpg'); // Set the MIME type for the response
    res.setHeader('Content-Disposition', 'attachment; filename=' + data.name); // Optional: specify filename for download
    data.data.pipe(res);
  }

  @Public()
  @Delete('delete')
  async deleteFile(@Body() links: { link: string }) {
    console.log(links);
    const data = await this.storageServiceService.deleteFolder({ parent: DIRECTORY_NAMES.FILES, child: 'customer1' });
    return data;
  }
}

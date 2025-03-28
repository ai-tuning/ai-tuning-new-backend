import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AutomatisationDto } from './dto/create-file-service.dto';
import { FileServiceService } from './file-service.service';
import { PrepareSolutionDto } from './dto/prepare-solution.dto';
import { Types } from 'mongoose';
import { Response } from 'express';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';

@Controller('file-services')
export class FileServiceController {
    constructor(private readonly fileServiceService: FileServiceService) {}

    @Get('admins/:adminId')
    async findByAdmin(@Param('adminId') adminId: Types.ObjectId) {
        return await this.fileServiceService.findByAdminId(adminId);
    }

    @Get('customers/:customerId')
    async findByCustomer(@Param('customerId') customerId: Types.ObjectId) {
        return this.fileServiceService.findByCustomerId(customerId);
    }

    @Get(':fileServiceId')
    async findById(
        @Param('fileServiceId') fileServiceId: Types.ObjectId,
        @Query('adminId') adminId: Types.ObjectId,
        @AuthUser() authUser: IAuthUser,
    ) {
        return this.fileServiceService.findSingleById(fileServiceId, adminId, authUser);
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post('automatisation')
    async automatisation(@Body() automatisationDto: AutomatisationDto, @UploadedFile() file: Express.Multer.File) {
        return await this.fileServiceService.automatisation(automatisationDto, file);
    }

    @Post('prepare-solution')
    async prepareSolution(@Body() prepareSolutionDto: PrepareSolutionDto) {
        const data = await this.fileServiceService.prepareSolution(prepareSolutionDto);
        return { data, message: 'Your request is submitted successfully' };
    }

    @Post('download')
    async downloadFile(@Res() res: Response, @Body() body: { key: string }) {
        if (!body.key) throw new BadRequestException('File not found');
        const data = await this.fileServiceService.downloadFile(body.key);
        data.pipe(res);
    }

    @UseInterceptors(FileInterceptor('modFile'))
    @Patch('upload-mod-file')
    async uploadModFile(
        @Body() body: { fileServiceId: Types.ObjectId },
        @AuthUser() authUser: IAuthUser,
        @UploadedFile() modFile: Express.Multer.File,
    ) {
        const data = await this.fileServiceService.uploadModFile(body.fileServiceId, modFile, authUser);
        return { data, message: 'Your request is submitted successfully' };
    }

    @Get('manual-build/:fileServiceId')
    async manualBuild(@Param('fileServiceId') fileServiceId: Types.ObjectId, @Res() res: Response) {
        const data = await this.fileServiceService.manualBuild(fileServiceId);
        res.setTimeout(180000);
        res.status(200).json({ data, message: 'Manual build successful' });
    }

    @Patch('ai-assistant')
    async updateAiAssistant(@Body() body: { fileServiceId: Types.ObjectId; aiAssist: boolean }) {
        if (!body.fileServiceId) throw new BadRequestException('File service not found');
        return await this.fileServiceService.updateAiAssistant(body.fileServiceId, body.aiAssist);
    }

    @Get('close/:fileServiceId')
    async closeFileService(@Param('fileServiceId') fileServiceId: Types.ObjectId) {
        const fileService = await this.fileServiceService.closeFileService(fileServiceId);
        return { data: fileService, message: 'File service closed successfully' };
    }
    @Get('progress/:fileServiceId')
    async progressFileService(@Param('fileServiceId') fileServiceId: Types.ObjectId) {
        const fileService = await this.fileServiceService.progressFileService(fileServiceId);
        return fileService;
    }

    @Get('refund/:fileServiceId')
    async refundFilesErvice(@Param('fileServiceId') fileServiceId: Types.ObjectId) {
        const fileService = await this.fileServiceService.refundFileService(fileServiceId);
        return { data: fileService, message: 'File service refunded successfully' };
    }

    @Delete(':fileServiceId')
    async deleteFileService(@Param('fileServiceId') fileServiceId: Types.ObjectId) {
        const fileService = await this.fileServiceService.deleteFileService(fileServiceId);
        return { data: fileService, message: 'File service deleted successfully' };
    }
}

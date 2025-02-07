import { Controller, Post, Body, UseInterceptors, UploadedFiles, Get, Param, Res, Delete } from '@nestjs/common';
import { ScriptService } from './script.service';
import { CreateScriptDto } from './dto/create-script.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { AccessRole, IAuthUser } from '../common';
import { Types } from 'mongoose';
import { Response } from 'express';
import { RolesEnum } from '../constant';

@Controller('scripts')
export class ScriptController {
  constructor(private readonly scriptService: ScriptService) {}

  @Get()
  getScriptByAdmin(@AuthUser() authUser: IAuthUser) {
    return this.scriptService.findByAdmin(authUser.admin);
  }

  @UseInterceptors(FileFieldsInterceptor([{ name: 'originalFile', maxCount: 1 }, { name: 'modFiles' }]))
  @Post()
  async addScript(
    @Body() createScriptDto: CreateScriptDto,
    @UploadedFiles() files: { originalFile?: Express.Multer.File[]; modFiles?: Express.Multer.File[] },
  ) {
    const data = await this.scriptService.create(createScriptDto, files.originalFile[0], files.modFiles);
    return { data, message: 'Script created successfully' };
  }

  @AccessRole([RolesEnum.ADMIN])
  @Get('download/:scriptId')
  async downloadScript(@Param('scriptId') scriptId: Types.ObjectId, @Res() res: Response) {
    const filePath = await this.scriptService.downloadScript(scriptId);
    res.header('Content-Type', 'application/octet-stream');
    res.download(filePath);
  }

  @AccessRole([RolesEnum.ADMIN])
  @Delete(':scriptId')
  async deleteScript(@Param('scriptId') scriptId: Types.ObjectId) {
    const deletedScript = await this.scriptService.deleteScript(scriptId);
    return { deletedScript, message: 'Script deleted successfully' };
  }
}

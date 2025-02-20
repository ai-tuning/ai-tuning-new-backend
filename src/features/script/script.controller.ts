import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  Get,
  Param,
  Res,
  Delete,
  Patch,
  UploadedFile,
} from '@nestjs/common';
import { ScriptService } from './script.service';
import { CreateScriptDto } from './dto/create-script.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { AccessRole, IAuthUser } from '../common';
import { Types } from 'mongoose';
import { Response } from 'express';
import { RolesEnum } from '../constant';
import { ReplaceScriptDto } from './dto/replace-script.dto';

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
    const originalFile = files.originalFile ? files.originalFile[0] : null;
    const data = await this.scriptService.create(createScriptDto, originalFile, files.modFiles);
    return { data, message: 'Script created successfully' };
  }

  @AccessRole([RolesEnum.ADMIN, RolesEnum.SUPER_ADMIN])
  @Get('download/:scriptId')
  async downloadScript(@Param('scriptId') scriptId: Types.ObjectId, @Res() res: Response) {
    const filePath = await this.scriptService.downloadScript(scriptId);
    res.header('Content-Type', 'application/octet-stream');
    res.download(filePath);
  }

  @AccessRole([RolesEnum.ADMIN, RolesEnum.SUPER_ADMIN])
  @Delete(':scriptId')
  async deleteScript(@Param('scriptId') scriptId: Types.ObjectId) {
    const deletedScript = await this.scriptService.deleteScript(scriptId);
    return { deletedScript, message: 'Script deleted successfully' };
  }

  @AccessRole([RolesEnum.ADMIN, RolesEnum.SUPER_ADMIN])
  @UseInterceptors(FileInterceptor('modFile'))
  @Patch('replace-script')
  async replaceScript(@Body() replaceScriptDto: ReplaceScriptDto, @UploadedFile() file: Express.Multer.File) {
    await this.scriptService.replaceScript(replaceScriptDto, file);
    return { message: 'Script replaced successfully' };
  }
}

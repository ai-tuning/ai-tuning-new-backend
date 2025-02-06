import { Controller, Post, Body, UseInterceptors, UploadedFiles, Get } from '@nestjs/common';
import { ScriptService } from './script.service';
import { CreateScriptDto } from './dto/create-script.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';

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
}

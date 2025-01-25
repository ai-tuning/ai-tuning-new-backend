import { Controller, Get, Body, Patch, Param, Delete } from '@nestjs/common';
import { Types } from 'mongoose';
import { CredentialService } from './credential.service';
import { Credential } from './schema/credential.schema';
import {
  AlienTechCredentialDto,
  AutoFlasherCredentialDto,
  AutoTunerCredentialDto,
  CreateCredentialDto,
  EvcCredentialDto,
  PaypalCredentialDto,
} from './dto/create-credential.dto';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';

@Controller('credentials')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @Get('')
  async findOneByAdmin(@AuthUser() authUser: IAuthUser): Promise<Credential> {
    return await this.credentialService.findByAdmin(authUser.admin);
  }

  @Patch('')
  updateCredential(@Body() credentialDto: CreateCredentialDto) {
    return this.credentialService.updateAllCredential(credentialDto.admin, credentialDto);
  }

  // @Patch('papal/:id')
  // updatePaypalCredential(@Param('id') id: Types.ObjectId, @Body() paypalCredentialDto: PaypalCredentialDto) {
  //   return this.credentialService.updatePaypalCredential(id, paypalCredentialDto);
  // }
  // @Patch('alien-tech/:id')
  // updateAlienTechCredential(@Param('id') id: Types.ObjectId, @Body() alienTechCredentialDto: AlienTechCredentialDto) {
  //   return this.credentialService.updateAlienTechCredential(id, alienTechCredentialDto);
  // }
  // @Patch('auto-tuner/:id')
  // updateAutoTunerCredential(@Param('id') id: Types.ObjectId, @Body() autoTunerCredentialDto: AutoTunerCredentialDto) {
  //   return this.credentialService.updateAutoTunerCredential(id, autoTunerCredentialDto);
  // }
  // @Patch('auto-flasher/:id')
  // updateAutoFlasherCredential(
  //   @Param('id') id: Types.ObjectId,
  //   @Body() autoFlasherCredentialDto: AutoFlasherCredentialDto,
  // ) {
  //   return this.credentialService.updateAutoFlasherCredential(id, autoFlasherCredentialDto);
  // }
  // @Patch('evc/:id')
  // updateEvcCredential(@Param('id') id: Types.ObjectId, @Body() evcCredentialDto: EvcCredentialDto) {
  //   return this.credentialService.updateEvcCredential(id, evcCredentialDto);
  // }
}

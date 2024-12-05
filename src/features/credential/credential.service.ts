import { createCipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

import { Injectable } from '@nestjs/common';
import {
  AlienTechCredentialDto,
  AutoFlasherCredentialDto,
  AutoTunerCredentialDto,
  EvcCredentialDto,
  PaypalCredentialDto,
} from './dto/create-credential.dto';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { ClientSession, Model, Types } from 'mongoose';
import { Credential } from './schema/credential.schema';
import { ConfigService } from '@nestjs/config';
import { appConfig } from '../config';

@Injectable()
export class CredentialService {
  constructor(
    @InjectModel(collectionsName.credential)
    private readonly credentialModel: Model<Credential>,
  ) {}

  async create(adminId: Types.ObjectId, session: ClientSession): Promise<Credential> {
    const credential = new this.credentialModel({ admin: adminId });
    return credential.save({ session });
  }

  async updateCredential(
    adminId: Types.ObjectId,
    updateData:
      | PaypalCredentialDto
      | EvcCredentialDto
      | AutoTunerCredentialDto
      | AlienTechCredentialDto
      | AutoFlasherCredentialDto,
  ) {
    const credential = await this.credentialModel.findOneAndUpdate(
      {
        admin: adminId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
      },
    );
    return credential;
  }

  async updatePaypalCredential(adminId: Types.ObjectId, paypalCredentialDto: PaypalCredentialDto) {
    const payload: PaypalCredentialDto = {
      clientId: this.encryptData(paypalCredentialDto.clientId),
      clientSecret: this.encryptData(paypalCredentialDto.clientSecret),
    };
    const credential = this.updateCredential(adminId, payload);
    return credential;
  }

  async updateEvcCredential(adminId: Types.ObjectId, evcCredentialDto: EvcCredentialDto) {
    const payload: EvcCredentialDto = {
      apiId: this.encryptData(evcCredentialDto.apiId),
      password: this.encryptData(evcCredentialDto.password),
      username: this.encryptData(evcCredentialDto.username),
    };
    const credential = this.updateCredential(adminId, payload);
    return credential;
  }
  async updateAutoTunerCredential(adminId: Types.ObjectId, autoTunerCredentialDto: AutoTunerCredentialDto) {
    const payload: AutoTunerCredentialDto = {
      apiKey: this.encryptData(autoTunerCredentialDto.apiKey),
      tunerId: this.encryptData(autoTunerCredentialDto.tunerId),
    };
    const credential = this.updateCredential(adminId, payload);
    return credential;
  }
  async updateAlienTechCredential(adminId: Types.ObjectId, alienTechCredentialDto: AlienTechCredentialDto) {
    const payload: AlienTechCredentialDto = {
      clientId: this.encryptData(alienTechCredentialDto.clientId),
      clientSecret: this.encryptData(alienTechCredentialDto.clientSecret),
    };
    const credential = this.updateCredential(adminId, payload);
    return credential;
  }

  async updateAutoFlasherCredential(adminId: Types.ObjectId, autoFlasherDto: AutoFlasherCredentialDto) {
    const payload = { autoFlasher: this.encryptData(autoFlasherDto.autoFlasher) };
    const credential = this.updateCredential(adminId, payload);
    return credential;
  }

  async findByAdmin(adminId: Types.ObjectId, select?: string): Promise<Credential> {
    const credential = await this.credentialModel.findOne({ admin: adminId }).select(select);

    //decrypt all before return
    if (credential.paypal) {
      credential.paypal.clientId = this.decryptData(credential.paypal.clientId);
      credential.paypal.clientSecret = this.decryptData(credential.paypal.clientSecret);
    }
    if (credential.evc) {
      credential.evc.apiId = this.decryptData(credential.evc.apiId);
      credential.evc.password = this.decryptData(credential.evc.password);
      credential.evc.username = this.decryptData(credential.evc.username);
    }
    if (credential.autoTuner) {
      credential.autoTuner.apiKey = this.decryptData(credential.autoTuner.apiKey);
      credential.autoTuner.tunerId = this.decryptData(credential.autoTuner.tunerId);
    }
    if (credential.alienTech) {
      credential.alienTech.clientId = this.decryptData(credential.alienTech.clientId);
      credential.alienTech.clientSecret = this.decryptData(credential.alienTech.clientSecret);
    }
    if (credential.autoFlasher) credential.autoFlasher = this.decryptData(credential.autoFlasher);

    return credential;
  }

  //encrypt and decrypt
  private encryptData(data: string): string {
    const config = appConfig();
    const key = config.encryption_key;
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-ctr', key, iv);
    const encryptedText = Buffer.concat([cipher.update(data), cipher.final()]);
    return encryptedText.toString('hex');
  }

  private decryptData(data: string): string {
    const config = appConfig();
    const key = config.encryption_key;
    const iv = randomBytes(16);
    const decipher = createCipheriv('aes-256-ctr', key, iv);
    const encryptedText = Buffer.from(data, 'hex');
    const decryptedText = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decryptedText.toString();
  }

  remove(id: number) {
    return `This action removes a #${id} credential`;
  }
}

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { ClientSession, Model, Types } from 'mongoose';
import { Credential } from './schema/credential.schema';
import { appConfig } from '../config';
import { UpdateCredentialDto } from './dto/update-credential.dto';
import {
  AlienTechCredentialDto,
  AutoFlasherCredentialDto,
  AutoTunerCredentialDto,
  EvcCredentialDto,
  PaypalCredentialDto,
} from './dto/create-credential.dto';

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

  async updateAllCredential(adminId: Types.ObjectId, updateCredentialDto: UpdateCredentialDto) {
    //encrypt all
    if (updateCredentialDto.paypal) {
      updateCredentialDto.paypal.clientId = this.encryptData(updateCredentialDto.paypal.clientId);
      updateCredentialDto.paypal.clientSecret = this.encryptData(updateCredentialDto.paypal.clientSecret);
    }
    if (updateCredentialDto.evc) {
      updateCredentialDto.evc.apiId = this.encryptData(updateCredentialDto.evc.apiId);
      updateCredentialDto.evc.password = this.encryptData(updateCredentialDto.evc.password);
      updateCredentialDto.evc.username = this.encryptData(updateCredentialDto.evc.username);
    }
    if (updateCredentialDto.alienTech) {
      updateCredentialDto.alienTech.clientId = this.encryptData(updateCredentialDto.alienTech.clientId);
      updateCredentialDto.alienTech.clientSecret = this.encryptData(updateCredentialDto.alienTech.clientSecret);
    }
    if (updateCredentialDto.autoFlasher) {
      updateCredentialDto.autoFlasher.apiKey = this.encryptData(updateCredentialDto.autoFlasher.apiKey);
    }

    const credential = await this.credentialModel.findOneAndUpdate(
      {
        admin: adminId,
      },
      {
        $set: updateCredentialDto,
      },
      {
        new: true,
      },
    );

    //decrypt all
    // if (credential.paypal) {
    //   credential.paypal.clientId = this.decryptData(credential.paypal.clientId);
    //   credential.paypal.clientSecret = this.decryptData(credential.paypal.clientSecret);
    // }
    // if (credential.evc) {
    //   credential.evc.apiId = this.decryptData(credential.evc.apiId);
    //   credential.evc.password = this.decryptData(credential.evc.password);
    //   credential.evc.username = this.decryptData(credential.evc.username);
    // }
    // if (credential.alienTech) {
    //   credential.alienTech.clientId = this.decryptData(credential.alienTech.clientId);
    //   credential.alienTech.clientSecret = this.decryptData(credential.alienTech.clientSecret);
    // }
    // if (credential.autoFlasher) {
    //   credential.autoFlasher.apiKey = this.decryptData(credential.autoFlasher.apiKey);
    // }

    return credential;
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

  async updateAlienTechAccessToken(adminId: Types.ObjectId, alienTechAccessToken: string) {
    const payload = { alienTech: { accessToken: this.encryptData(alienTechAccessToken) } };
    const credential = await this.credentialModel.findOneAndUpdate(
      { admin: adminId },
      { $set: payload },
      { new: true },
    );
    return credential;
  }

  async updateAutoFlasherCredential(adminId: Types.ObjectId, autoFlasherDto: AutoFlasherCredentialDto) {
    const payload = { apiKey: this.encryptData(autoFlasherDto.apiKey) };
    const credential = this.updateCredential(adminId, payload);
    return credential;
  }

  async findByAdmin(adminId: Types.ObjectId, select?: keyof Credential): Promise<Credential> {
    const credential = await this.credentialModel.findOne({ admin: adminId }).select(select).lean();

    if (!credential) return null;

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
    if (credential.autoFlasher) credential.autoFlasher.apiKey = this.decryptData(credential.autoFlasher.apiKey);

    return credential;
  }

  // Function to validate and handle key retrieval (replace with your actual logic)
  private getEncryptionKey() {
    const config = appConfig(); // Replace with your configuration retrieval logic
    const key = config.encryption_key;

    // Validate key length (assuming stored as a string)
    if (key.length !== 64) {
      throw new Error('Invalid encryption key length. Expected 32 bytes (256 bits).');
    }

    // Convert key to a Buffer (assuming stored as a string)
    return Buffer.from(key, 'hex');
  }

  private encryptData(data: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = randomBytes(16); // Generate a random initialization vector
      const cipher = createCipheriv('aes-256-ctr', key, iv);
      const encryptedText = Buffer.concat([cipher.update(data), cipher.final()]);
      return iv.toString('hex') + encryptedText.toString('hex'); // Prepend IV to ciphertext
    } catch (error) {
      console.error('Encryption error:', error);
      throw error; // Rethrow the error for proper handling
    }
  }

  private decryptData(data: string): string {
    try {
      const encryptedText = Buffer.from(data, 'hex');
      const iv = encryptedText.slice(0, 16); // Extract IV from the beginning
      const ciphertext = encryptedText.slice(16); // Extract ciphertext
      const key = this.getEncryptionKey();
      const decipher = createDecipheriv('aes-256-ctr', key, iv);
      const decryptedText = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decryptedText.toString();
    } catch (error) {
      console.error('Decryption error:', error);
      throw error; // Rethrow the error for proper handling
    }
  }

  remove(id: number) {
    return `This action removes a #${id} credential`;
  }
}

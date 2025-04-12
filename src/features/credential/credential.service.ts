import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { createTransport, Transporter, TransportOptions } from 'nodemailer';
import { BadRequestException, Injectable } from '@nestjs/common';

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
    FlexSlaveDto,
    PaypalCredentialDto,
    SMTPCredentialDto,
} from './dto/create-credential.dto';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

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
        if (updateCredentialDto.flexSlave) {
            updateCredentialDto.flexSlave.apiKey = this.encryptData(updateCredentialDto.flexSlave.apiKey);
        }
        if (updateCredentialDto.autoTuner) {
            updateCredentialDto.autoTuner.apiKey = this.encryptData(updateCredentialDto.autoTuner.apiKey);
            updateCredentialDto.autoTuner.tunerId = this.encryptData(updateCredentialDto.autoTuner.tunerId);
        }

        if (updateCredentialDto.smtp) {
            updateCredentialDto.smtp.host = this.encryptData(updateCredentialDto.smtp.host);
            updateCredentialDto.smtp.port = updateCredentialDto.smtp.port;
            updateCredentialDto.smtp.username = this.encryptData(updateCredentialDto.smtp.username);
            updateCredentialDto.smtp.password = this.encryptData(updateCredentialDto.smtp.password);
            updateCredentialDto.smtp.from = updateCredentialDto.smtp.from;
            updateCredentialDto.smtp.support = updateCredentialDto.smtp.support;
            updateCredentialDto.smtp.senderName = updateCredentialDto.smtp.senderName;
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

        return credential;
    }

    async updateCredential(
        adminId: Types.ObjectId,
        updateData:
            | PaypalCredentialDto
            | EvcCredentialDto
            | AutoTunerCredentialDto
            | AlienTechCredentialDto
            | AutoFlasherCredentialDto
            | FlexSlaveDto
            | SMTPCredentialDto,
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
        const credential = await this.credentialModel.findOneAndUpdate(
            { admin: adminId },
            {
                $set: {
                    'alienTech.accessToken': alienTechAccessToken,
                },
            },
            { new: true },
        );
        return credential;
    }

    async updateAutoFlasherCredential(adminId: Types.ObjectId, autoFlasherDto: AutoFlasherCredentialDto) {
        const payload = { apiKey: this.encryptData(autoFlasherDto.apiKey) };
        const credential = this.updateCredential(adminId, payload);
        return credential;
    }

    async updateFlexSlaveCredential(adminId: Types.ObjectId, flexSlaveDto: FlexSlaveDto) {
        const payload = { apiKey: this.encryptData(flexSlaveDto.apiKey) };
        const credential = this.updateCredential(adminId, payload);
        return credential;
    }

    async updateSmtpCredential(adminId: Types.ObjectId, smtpCredentialDto: SMTPCredentialDto) {
        const payload = {
            host: this.encryptData(smtpCredentialDto.host),
            port: smtpCredentialDto.port,
            username: this.encryptData(smtpCredentialDto.username),
            password: this.encryptData(smtpCredentialDto.password),
            from: smtpCredentialDto.from,
            support: smtpCredentialDto.support,
            senderName: smtpCredentialDto.senderName,
        };
        const credential = this.updateCredential(adminId, payload);
        return credential;
    }

    async findByAdmin(adminId: Types.ObjectId, select?: keyof Credential): Promise<Credential> {
        const credential = await this.credentialModel.findOne({ admin: adminId }).select(select).lean();

        if (!credential) return null;

        if (select === 'alienTech') {
            if (!credential.alienTech.clientId || !credential.alienTech.clientSecret) {
                return null;
            }
        }

        if (select === 'autoTuner') {
            if (!credential.autoTuner.apiKey || !credential.autoTuner.tunerId) {
                return null;
            }
        }

        if (select === 'autoFlasher') {
            if (!credential.autoFlasher.apiKey) {
                return null;
            }
        }

        if (select === 'flexSlave') {
            if (!credential.flexSlave.apiKey) {
                return null;
            }
        }

        if (select === 'paypal') {
            if (!credential.paypal.clientId || !credential.paypal.clientSecret) {
                return null;
            }
        }

        if (select === 'smtp') {
            if (
                !credential.smtp.host ||
                !credential.smtp.port ||
                !credential.smtp.username ||
                !credential.smtp.password ||
                !credential.smtp.from ||
                !credential.smtp.support ||
                !credential.smtp.senderName
            ) {
                return null;
            }
        }

        //decrypt all before return
        if (credential.paypal) {
            credential.paypal.clientId = this.decryptData(credential.paypal.clientId);
            credential.paypal.clientSecret = this.decryptData(credential.paypal.clientSecret);
        }
        if (credential.evc) {
            for (const key in credential.evc) {
                if (credential.evc[key]) {
                    credential.evc[key] = this.decryptData(credential.evc[key]);
                }
            }
        }
        if (credential.autoTuner) {
            for (const key in credential.autoTuner) {
                if (credential.autoTuner[key]) {
                    credential.autoTuner[key] = this.decryptData(credential.autoTuner[key]);
                }
            }
        }
        if (credential.alienTech) {
            for (const key in credential.alienTech) {
                if (key === 'accessToken') continue;
                if (credential.alienTech[key]) {
                    credential.alienTech[key] = this.decryptData(credential.alienTech[key]);
                }
            }
        }

        if (credential.autoFlasher) credential.autoFlasher.apiKey = this.decryptData(credential.autoFlasher.apiKey);

        if (credential.flexSlave) credential.flexSlave.apiKey = this.decryptData(credential.flexSlave.apiKey);
        if (credential.smtp) {
            credential.smtp.host = this.decryptData(credential.smtp.host);
            credential.smtp.port = credential.smtp.port;
            credential.smtp.username = this.decryptData(credential.smtp.username);
            credential.smtp.password = this.decryptData(credential.smtp.password);
            credential.smtp.from = credential.smtp.from;
            credential.smtp.support = credential.smtp.support;
            credential.smtp.senderName = credential.smtp.senderName;
        }

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

    async testSMTPCredential(smtpCredentialDto: SMTPCredentialDto) {
        console.log(smtpCredentialDto);
        const transporter: Transporter = createTransport({
            host: smtpCredentialDto.host,
            port: smtpCredentialDto.port,
            secure: true,
            auth: { user: smtpCredentialDto.username, pass: smtpCredentialDto.password },
        } as unknown as SMTPTransport.Options);

        const isVerified = await transporter.verify();

        if (!isVerified) {
            throw new BadRequestException('Invalid SMTP credentials');
        }
        console.log(isVerified);
        return isVerified;
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
}

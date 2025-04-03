import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { CredentialService } from '../credential/credential.service';
import { DecodeAutoTunerFileDto } from './dto/autotuner.dto';
import { PathService } from '../common';

interface AutoTunerEncodePayload {
    slave_id: string;
    ecu_id: string;
    model_id: string;
    mcu_id: string;
    filePath: string;
    adminId: Types.ObjectId;
    fileServiceId: Types.ObjectId;
}

@Injectable()
export class AutoTunerService {
    constructor(
        private readonly httpService: HttpService,
        private readonly credentialService: CredentialService,
        private readonly pathService: PathService,
    ) {}
    /**
     * Decode the encoded file and return the decoded information
     * @param decodeAutoTunerFileDto
     * @returns
     */
    async decode(decodeAutoTunerFileDto: DecodeAutoTunerFileDto) {
        const parsed = path.parse(decodeAutoTunerFileDto.filePath);
        const decodedFilePath = path.join(
            this.pathService.getFileServicePath(decodeAutoTunerFileDto.adminId, decodeAutoTunerFileDto.tempFileId),
            parsed.name + '-decoded.bin',
        );
        try {
            const buffer = fs.readFileSync(decodeAutoTunerFileDto.filePath);
            const base64Data = buffer.toString('base64');

            const requestData = {
                mode: 'maps',
                data: base64Data,
            };

            const apiService = await this.apiService(decodeAutoTunerFileDto.adminId);
            // Send the request using axios
            const { data } = await apiService.post('/decrypt', requestData);

            if (data.status === 'OK') {
                const mapsData = Buffer.from(data.data, 'base64');
                const hash = crypto.createHash('sha256').update(mapsData).digest('hex').toUpperCase();

                if (hash !== data.hash) {
                    throw new BadRequestException('Hash not match');
                } else {
                    await fs.promises.writeFile(decodedFilePath, mapsData);
                    return {
                        mode: data.mode,
                        slave_id: data.slave_id,
                        ecu_id: data.ecu_id,
                        model_id: data.model_id,
                        mcu_id: data.mcu_id,
                        decodedFilePath: decodedFilePath,
                        decodedFileName: path.basename(decodedFilePath),
                    };
                }
            } else {
                throw new BadRequestException('Something went wrong with AutoTuner ');
            }
        } catch (error) {
            if (decodedFilePath && fs.existsSync(decodedFilePath)) {
                fs.unlinkSync(decodedFilePath);
            }
            throw error;
        }
    }

    /**
     * encode the file
     * @param autoTunerEncodeDto
     * @returns
     */
    async encode(autoTunerEncodeDto: AutoTunerEncodePayload) {
        const parseFile = path.parse(autoTunerEncodeDto.filePath);
        const name = parseFile.name.replace(/decoded/gi, 'modified');

        const basePath = path.join(
            this.pathService.getFileServicePath(autoTunerEncodeDto.adminId, autoTunerEncodeDto.fileServiceId),
        );

        if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);

        const encryptedFilePath = path.join(basePath, name + '.slave');

        try {
            // Read the binary data from the file
            const buffer = await fs.promises.readFile(autoTunerEncodeDto.filePath);

            // Convert the data to Base64
            const base64Data = buffer.toString('base64');

            // Prepare the request payload
            const requestData = {
                mode: 'maps',
                data: base64Data,
                slave_id: autoTunerEncodeDto.slave_id,
                ecu_id: autoTunerEncodeDto.ecu_id,
                model_id: autoTunerEncodeDto.model_id,
                mcu_id: autoTunerEncodeDto.mcu_id,
            };
            console.log('requestData', requestData);

            const apiService = await this.apiService(autoTunerEncodeDto.adminId);
            // Send the request to encrypt the data
            const { data } = await apiService.post('/encrypt', requestData);

            // Handle the response
            if (data.status === 'OK') {
                console.log('File successfully encrypted.');
                const encryptedData = Buffer.from(data.data, 'base64');
                const hash = crypto.createHash('sha256').update(encryptedData).digest('hex').toUpperCase();

                if (hash !== data.hash) {
                    throw new BadRequestException('Hash not match');
                } else {
                    // Write the encrypted data to a new file
                    await fs.promises.writeFile(encryptedFilePath, encryptedData);
                    console.log(`Encrypted file saved to: ${encryptedFilePath}`);
                }
            } else {
                throw new BadRequestException('Encryption failed: ' + data.message);
            }
            return encryptedFilePath;
        } catch (error) {
            if (encryptedFilePath && fs.existsSync(encryptedFilePath)) {
                fs.unlinkSync(encryptedFilePath);
            }
            throw error;
        }
    }

    private async apiService(adminId: Types.ObjectId) {
        //get the autotuner credential from db
        const credential = await this.credentialService.findByAdmin(adminId, 'autoTuner');
        if (!credential.autoTuner) {
            throw new BadRequestException('Auto Tuner Credential not found');
        }
        console.log('autotuner credential', credential);
        this.httpService.axiosRef.interceptors.request.use(
            async (config) => {
                config.headers['X-Autotuner-Id'] = credential.autoTuner.tunerId;
                config.headers['X-Autotuner-API-Key'] = credential.autoTuner.apiKey;
                config.headers['Content-Type'] = 'application/json';

                return config;
            },
            (error) => {
                return Promise.reject(error);
            },
        );
        return this.httpService.axiosRef;
    }
}

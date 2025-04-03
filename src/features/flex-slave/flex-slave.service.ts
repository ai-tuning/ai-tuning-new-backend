import * as fs from 'fs';
import * as path from 'path';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { CredentialService } from '../credential/credential.service';
import { PathService } from '../common';
import { DecryptFlexDto } from './dto/flex-slave.dto';
import * as FormData from 'form-data';

interface FlexEncryptPayload {
    sn: string;
    filePath: string;
    adminId: Types.ObjectId;
    fileServiceId: Types.ObjectId;
}

@Injectable()
export class FlexSlaveService {
    constructor(
        private readonly httpService: HttpService,
        private readonly credentialService: CredentialService,
        private readonly pathService: PathService,
    ) {}

    /**
     * Decode the encoded file and return the decoded information
     * @param decryptFlexDto
     * @returns
     */
    async decrypt(decryptFlexDto: DecryptFlexDto) {
        const parsed = path.parse(decryptFlexDto.filePath);
        const decodedFilePath = path.join(
            this.pathService.getFileServicePath(decryptFlexDto.adminId, decryptFlexDto.tempFileId),
            parsed.name + '-decoded.bin',
        );
        try {
            const readFileStream = fs.createReadStream(decryptFlexDto.filePath);

            const formData = new FormData();
            formData.append('sn', decryptFlexDto.sn);
            formData.append('input_file', readFileStream);
            console.log(decryptFlexDto.sn);
            const apiService = await this.apiService(decryptFlexDto.adminId);
            // Send the request using axios
            const { data } = await apiService.post('/master/api/v1/slave_manager/decrypt', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Accept: 'application/json',
                },
            }); // Modified API endpoint
            console.log(data);
            if (data.status === 'OK') {
                const mapsData = Buffer.from(data.output_file_base64, 'base64');

                await fs.promises.writeFile(decodedFilePath, mapsData);
                return {
                    decodedFilePath: decodedFilePath,
                    decodedFileName: path.basename(decodedFilePath),
                };
            } else {
                throw new BadRequestException('Something went wrong with AutoTuner ');
            }
        } catch (error) {
            console.log(error);
            if (decodedFilePath && fs.existsSync(decodedFilePath)) {
                fs.unlinkSync(decodedFilePath);
            }
            throw error;
        }
    }

    /**
     * encode the file
     * @param flexEncryptDto
     * @returns
     */
    async encrypt(flexEncryptDto: FlexEncryptPayload) {
        const parseFile = path.parse(flexEncryptDto.filePath);
        const name = parseFile.name.replace(/decoded/gi, 'modified');

        const basePath = path.join(
            this.pathService.getFileServicePath(flexEncryptDto.adminId, flexEncryptDto.fileServiceId),
        );

        if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);

        const encryptedFilePath = path.join(basePath, name + '.mmf');

        try {
            // Read the binary data from the file
            const readFileStream = fs.createReadStream(flexEncryptDto.filePath);

            const formData = new FormData();
            formData.append('input_file', readFileStream);
            formData.append('sn', flexEncryptDto.sn);
            formData.append('memory_type', 'ext_eeprom');

            const apiService = await this.apiService(flexEncryptDto.adminId);
            // Send the request to encrypt the data
            const { data } = await apiService.post('/master/api/v1/slave_manager/encrypt', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Accept: 'application/json',
                },
            }); // Modified API endpoint

            // Handle the response
            if (data.status === 'OK') {
                console.log('File successfully encrypted.');
                const encryptedData = Buffer.from(data.output_file_base64, 'base64');

                // Write the encrypted data to a new file
                await fs.promises.writeFile(encryptedFilePath, encryptedData);
                console.log(`Encrypted file saved to: ${encryptedFilePath}`);
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
        const credential = await this.credentialService.findByAdmin(adminId, 'flexSlave');
        if (!credential.flexSlave) {
            throw new BadRequestException('Flex Slave Credential not found');
        }
        console.log('flex-slave credential', credential);
        this.httpService.axiosRef.interceptors.request.use(
            async (config) => {
                config.headers['X-Api-Key'] = credential.flexSlave.apiKey;
                return config;
            },
            (error) => {
                return Promise.reject(error);
            },
        );
        return this.httpService.axiosRef;
    }
}

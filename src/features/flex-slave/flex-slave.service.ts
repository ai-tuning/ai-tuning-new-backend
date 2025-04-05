import * as fs from 'fs';
import * as path from 'path';
import unzipper from 'unzipper';

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
    documentId: Types.ObjectId;
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
        const rootpath = this.pathService.getFileServicePath(decryptFlexDto.adminId, decryptFlexDto.documentId);

        const parsed = path.parse(decryptFlexDto.filePath);

        let unzippedFilePath = path.join(rootpath, 'extracted_files' + decryptFlexDto.uniqueId);

        const decodedFilePath = path.join(rootpath, parsed.name + '-decoded.zip');

        try {
            //create root path if not exists
            if (!fs.existsSync(rootpath)) await fs.promises.mkdir(rootpath);

            if (fs.existsSync(unzippedFilePath)) {
                await fs.promises.rm(unzippedFilePath, { recursive: true });
            }

            const readFileStream = fs.createReadStream(decryptFlexDto.filePath);

            const formData = new FormData();
            formData.append('sn', decryptFlexDto.sn);
            formData.append('input_file', readFileStream);

            const apiService = await this.apiService(decryptFlexDto.adminId);
            // Send the request using axios
            const { data } = await apiService.post('/master/api/v1/slave_manager/decrypt', formData, {
                headers: {
                    Accept: 'application/json',
                },
            }); // Modified API endpoint
            console.log(data);
            if (data.status === 'OK') {
                const mapsData = Buffer.from(data.output_file_base64, 'base64');

                await fs.promises.writeFile(decodedFilePath, mapsData);

                //extract zip
                await this.extractZip(decodedFilePath, unzippedFilePath);
                console.log('unzipped to ' + unzippedFilePath);

                //delete the zip file
                if (fs.existsSync(decodedFilePath)) {
                    await fs.promises.rm(decodedFilePath);
                }

                console.log('deleted the zip file ' + unzippedFilePath);

                //read directory
                const files = await fs.promises.readdir(unzippedFilePath);
                console.log('files', files);
                if (!files.length) {
                    throw new BadRequestException('No files found in the zip file.');
                }

                const decodedFile = files[0];

                const newFileName = parsed.name + '-decoded.bin';

                const newDecodedFilePath = path.join(rootpath, newFileName);
                console.log('newDecodedFilePath', newDecodedFilePath);

                await fs.promises.rename(path.join(unzippedFilePath, decodedFile), newDecodedFilePath);
                console.log('file moved to ' + newDecodedFilePath);

                if (fs.existsSync(unzippedFilePath)) {
                    await fs.promises.rm(unzippedFilePath, { recursive: true });
                    console.log('deleted the directory ' + unzippedFilePath);
                }

                return {
                    decodedFilePath: newDecodedFilePath,
                    decodedFileName: path.basename(newDecodedFilePath),
                };
            } else {
                throw new BadRequestException('Something went wrong with AutoTuner ');
            }
        } catch (error) {
            console.log(error);
            if (decodedFilePath && fs.existsSync(decodedFilePath)) {
                await fs.promises.rm(decodedFilePath, { recursive: true });
            }
            if (unzippedFilePath && fs.existsSync(unzippedFilePath)) {
                await fs.promises.rm(unzippedFilePath, { recursive: true });
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
            this.pathService.getFileServicePath(flexEncryptDto.adminId, flexEncryptDto.documentId),
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
    private async extractZip(filePath: string, outputDir: string) {
        await fs
            .createReadStream(filePath)
            .pipe(unzipper.Extract({ path: outputDir }))
            .promise();
        console.log('Extraction complete');
    }
}

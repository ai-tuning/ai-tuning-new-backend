import * as fs from 'fs';
import * as path from 'path';
import unzipper from 'unzipper';
import FormData from 'form-data';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { CredentialService } from '../credential/credential.service';

interface AutoFlasherDecodeDto {
  filePath: string;
  customerId: Types.ObjectId;
  adminId: Types.ObjectId;
}
interface AutoFlasherEncodeDto {
  serialNumber: string;
  memory_type: string;
  filePath: string;
  adminId: Types.ObjectId;
}

@Injectable()
export class AutoFlasherService {
  /**
   * Path for storing decoded file for auto-flasher service
   */
  decodedPath = path.join(process.cwd(), 'public', 'autoflasher', 'decoded');

  /**
   * Path for storing decoded file for auto-flasher service
   */
  encodedPath = path.join(process.cwd(), 'public', 'solutions');

  constructor(
    private readonly httpService: HttpService,
    private readonly credentialService: CredentialService,
  ) {
    //create decoded and encoded folder if not exist when initializing the service
    if (!fs.existsSync(this.decodedPath)) {
      fs.mkdirSync(this.decodedPath, { recursive: true });
    }
    if (!fs.existsSync(this.encodedPath)) {
      fs.mkdirSync(this.encodedPath, { recursive: true });
    }
  }

  async getHexSn(sourceFilePath: string) {
    let chunkSize = 16;
    let visualSplit: number | boolean = 8;
    let innerIterator = 0;
    let maxRowLen = 0;

    if (visualSplit >= chunkSize) {
      visualSplit = false; // Disable when it doesn't make sense
    }
    if (chunkSize < 1) {
      chunkSize = 16;
    }

    try {
      await fs.promises.access(sourceFilePath); // Check if file exists
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      throw new Error('Cannot read source file.');
    }

    const { size: sourceFileSize } = await fs.promises.stat(sourceFilePath); // Get file size
    if (sourceFileSize < 1) {
      throw new Error('Source file is blank -- nothing to do.');
    }

    const sourceFileHandle = await fs.promises.open(sourceFilePath, 'r');
    let sn = [];

    for (let i = 0; i < sourceFileSize; i += chunkSize) {
      // Read chunk from file
      const buffer = Buffer.alloc(chunkSize);
      await sourceFileHandle.read(buffer, 0, chunkSize, i);
      const chunk = buffer.toString('binary');

      // Process each byte in the chunk
      let row =
        buffer
          .toString('hex')
          .match(/.{1,2}/g)
          .join(' ') + ' | ';
      let ci = 0;
      for (let v of chunk) {
        const hexValue = v.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
        row += hexValue + ' ';

        if (visualSplit !== false) {
          innerIterator++;
          if (innerIterator % visualSplit === 0) {
            row += ' ';
          }
        }

        if (i === 16 && ci >= 8 && ci <= 15) {
          sn.push(hexValue);
        }
        ci++;
      }

      if (row.length > maxRowLen) {
        maxRowLen = row.length;
      }
    }

    await sourceFileHandle.close();
    sn = sn.reverse();
    return sn.join('');
  }

  async extractZip(filePath: string, outputDir: string) {
    await fs
      .createReadStream(filePath)
      .pipe(unzipper.Extract({ path: outputDir }))
      .promise();
    console.log('Extraction complete');
  }

  async decode(autoFlasherDecodeDto: AutoFlasherDecodeDto) {
    const filePath = autoFlasherDecodeDto.filePath;
    let unzippedFilePath = path.join(this.decodedPath, 'extracted_files' + autoFlasherDecodeDto.customerId);
    const parsed = path.parse(filePath);
    const decodedFilePath = path.join(this.decodedPath, parsed.name + '-decoded.zip');
    try {
      if (fs.existsSync(unzippedFilePath)) {
        fs.rmSync(unzippedFilePath, { recursive: true });
      }

      const serialNumber = await this.getHexSn(filePath);

      console.log('serialNumber', serialNumber);

      const formData = new FormData();
      formData.append('sn', serialNumber);
      formData.append('input_file', fs.createReadStream(filePath));

      const apiService = await this.apiService(autoFlasherDecodeDto.adminId);

      // Send the request using axios
      const response = await apiService.post('/decrypt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'OK') {
        const mapsData = Buffer.from(response.data.output_file_base64, 'base64');

        await fs.promises.writeFile(decodedFilePath, mapsData);

        //extract zip
        await this.extractZip(decodedFilePath, unzippedFilePath);
        console.log('unzipped to ' + unzippedFilePath);

        //delete the zip file
        if (fs.existsSync(decodedFilePath)) {
          await fs.promises.unlink(decodedFilePath);
        }
        console.log('deleted the zip file ' + unzippedFilePath);

        //read directory
        const files = await fs.promises.readdir(unzippedFilePath);
        console.log('files', files);
        if (!files.length) {
          throw new BadRequestException('No files found in the zip file.');
        }

        const decodedFile = files[0];
        console.log('decodedFile', decodedFile);

        const memory_types = ['int_flash', 'ext_flash', 'int_eeprom', 'ext_eeprom', 'maps', 'full_dump'];

        let memory_type = '';

        for (const m_type of memory_types) {
          if (decodedFile.includes(m_type)) {
            console.log('memory_type', m_type);
            memory_type = m_type;
            break;
          }
        }
        const newFileName = parsed.name + '-decoded-' + memory_type + '.bin';
        const newDecodedFilePath = path.join(this.decodedPath, autoFlasherDecodeDto.adminId.toString(), newFileName);
        console.log('newDecodedFilePath', newDecodedFilePath);

        //move the files into DECODED__BASE_FILE_PATH directory
        await fs.promises.rename(path.join(unzippedFilePath, decodedFile), newDecodedFilePath);
        console.log('file moved to ' + newDecodedFilePath);

        if (fs.existsSync(unzippedFilePath)) {
          await fs.promises.rm(unzippedFilePath, { recursive: true });
          console.log('deleted the directory ' + unzippedFilePath);
        }

        return {
          serialNumber,
          memory_type,
          decodedFilePath: newDecodedFilePath,
          filename: path.basename(newDecodedFilePath),
        };
      } else {
        throw new BadRequestException(response.data.errors[0]);
      }
    } catch (error) {
      console.log(error);
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (decodedFilePath && fs.existsSync(decodedFilePath)) {
        fs.unlinkSync(decodedFilePath);
      }
    }
  }

  async encode(autoFlasherEncodeDto: AutoFlasherEncodeDto) {
    const parseFile = path.parse(autoFlasherEncodeDto.filePath);
    const name = parseFile.name.replace(/decoded/gi, 'modified');
    const encryptedFilePath = path.join(this.encodedPath, autoFlasherEncodeDto.adminId.toString(), name + '.atf');
    const formData = new FormData();
    formData.append('input_file', fs.createReadStream(autoFlasherEncodeDto.filePath));
    formData.append('sn', autoFlasherEncodeDto.serialNumber);
    formData.append('memory_type', autoFlasherEncodeDto.memory_type);

    const apiService = await this.apiService(autoFlasherEncodeDto.adminId);
    const response = await apiService.post('/encrypt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data.status === 'OK') {
      const mapsData = Buffer.from(response.data.output_file_base64, 'base64');
      await fs.promises.writeFile(encryptedFilePath, mapsData);
      return encryptedFilePath;
    }
  }

  private async apiService(adminId: Types.ObjectId) {
    //get the auto-flasher credential from db
    const credential = await this.credentialService.findByAdmin(adminId, 'autoFlasher');
    if (!credential.autoTuner) {
      throw new BadRequestException('Auto Flasher Credential not found');
    }
    this.httpService.axiosRef.interceptors.request.use(
      async (config) => {
        config.headers['X-API-Key'] = credential.autoFlasher.apiKey;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
    return this.httpService.axiosRef;
  }
}

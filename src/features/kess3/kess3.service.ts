import * as fs from 'fs';
import * as path from 'path';
import * as FormData from 'form-data';
import { Types } from 'mongoose';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CredentialService } from '../credential/credential.service';
import { DecodeKess3FileDto, EncodeKess3FileDto } from './dto/kess3-encode-decode.dto';
import { PathService } from '../common';

@Injectable()
export class Kess3Service {
  constructor(
    private readonly httpService: HttpService,
    private readonly credentialService: CredentialService,
    private readonly pathService: PathService,
  ) {}

  /**
   * upload encoded file for decoding
   * @param uniqueId
   * @param filePath
   * @param additionalInfo
   * @returns
   */
  private async uploadEncodedFile(
    uniqueId: string,
    filePath: string,
    adminId: Types.ObjectId,
    additionalInfo: { name: string; email: string },
    token: string,
  ) {
    const formData = new FormData();

    formData.append('readFile', fs.createReadStream(filePath));

    if (additionalInfo) {
      formData.append('userInfo', JSON.stringify(additionalInfo));
    }

    const apiService = this.apiService(adminId, token);
    const response = await apiService({
      method: 'post',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      url: `/api/kess3/decode-read-file/${uniqueId}`,
      data: formData,
    });
    console.log('upload ended');

    return response.data;
  }

  /**
   * get async information
   * @param asyncOperationGuid
   * @returns
   */
  private async getAsyncInformation(adminId: Types.ObjectId, asyncOperationGuid: string, token: string) {
    const apiService = this.apiService(adminId, token);
    const response = await apiService({
      url: `/api/async-operations/${asyncOperationGuid}`,
    });
    return response.data;
  }

  /**
   * Download the decoded file from the kess3
   * @param fileSlotGUID
   * @param mode
   * @param bootBenchComponents
   * @returns
   */
  private async downloadDecodeFile(
    adminId: Types.ObjectId,
    tempFileId: Types.ObjectId,
    fileSlotGUID: string,
    mode: string,
    bootBenchComponents: any[],
    token: string,
  ) {
    let fileType = 'OBDDecoded';
    let url = `/api/kess3/file-slots/${fileSlotGUID}/files/?fileType=${fileType}&download=true`;
    if (mode === 'BootBench') {
      const isFlashFileExist = bootBenchComponents.find((component) => component.type === 'Flash');
      const isMicroFileExist = bootBenchComponents.find((component) => component.type === 'Micro');

      if (isFlashFileExist) {
        fileType = 'BootBenchDecodedFlash';
      } else if (isMicroFileExist) {
        fileType = 'BootBenchDecodedMicro';
      } else {
        throw new Error('No BootBench files found');
      }
      url = `/api/kess3/file-slots/${fileSlotGUID}/files/?fileType=${fileType}&download=true`;
    }
    const apiService = this.apiService(adminId, token);
    const { data } = await apiService({
      method: 'get',
      url,
    });

    // Path where the file will be saved
    const filePath = path.join(this.pathService.getFileServicePath(adminId, tempFileId), data.name);

    // Decode Base64 string to a buffer
    const fileBuffer = Buffer.from(data.data, 'base64');

    // Write the buffer to a file
    await fs.promises.writeFile(filePath, fileBuffer);
    console.log('File saved successfully:', filePath);

    data.fileType = fileType;
    data.filePath = filePath;
    delete data.data;
    return data;
  }

  /**
   * download encoded file
   * @param fileSlotGUID
   * @param fileGUID
   * @returns
   */
  private async downloadEncodeFile(
    adminId: Types.ObjectId,
    fileServiceId: Types.ObjectId,
    fileSlotGUID: string,
    fileGUID: string,
    token: string,
  ) {
    const apiService = this.apiService(adminId, token);
    const { data } = await apiService({
      method: 'get',
      url: `/api/kess3/file-slots/${fileSlotGUID}/files/${fileGUID}?download=true`,
    });

    const basePath = path.join(this.pathService.getFileServicePath(adminId, fileServiceId));

    if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);

    // Path where the file will be saved
    const filePath = path.join(basePath, data.name);
    // Decode Base64 string to a buffer
    const fileBuffer = Buffer.from(data.data, 'base64');

    // Write the buffer to a file
    fs.promises.writeFile(filePath, fileBuffer);

    data.filePath = filePath;
    delete data.data;
    return data;
  }

  /**
   * Get file slots from kess3 api
   * @param adminId
   * @returns
   */
  private async getFileSlots(adminId: Types.ObjectId, token) {
    const alienTechApi = this.apiService(adminId, token);
    const response = await alienTechApi({
      method: 'get',
      url: `/api/kess3/file-slots`,
    });
    return response.data;
  }

  /**
   * close existing opened file slot
   * @param adminId
   * @param fileSlotGUID
   * @returns
   */
  private async closeFileSlot(adminId: Types.ObjectId, fileSlotGUID: string, token: string) {
    const alienTechApi = this.apiService(adminId, token);

    const response = await alienTechApi({
      method: 'post',
      url: `/api/kess3/file-slots/${fileSlotGUID}/close`,
    });
    return response.data;
  }

  /**
   * re open file slot
   * @param fileSlotGUID
   * @returns
   */
  private async reOpenFileSlot(adminId: Types.ObjectId, fileSlotGUID: string, token: string) {
    const apiService = this.apiService(adminId, token);
    const response = await apiService({
      method: 'post',
      url: `/api/kess3/file-slots/${fileSlotGUID}/reopen`,
    });
    return response.data;
  }

  /**
   * this function is used to get the status of the async operation after some interval
   * @param adminId
   * @param interval
   * @param timeout
   * @param asyncOperationGuid
   * @returns
   */
  private async resolveAsyncOperation(
    adminId: Types.ObjectId,
    interval: number,
    timeout: number,
    asyncOperationGuid: string,
    token: string,
  ): Promise<any> {
    const start = Date.now();
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const data = await this.getAsyncInformation(adminId, asyncOperationGuid, token);
          console.log('kess3 async operation=======>', data);
          if (data.isCompleted && data.isSuccessful) {
            resolve(data); // Resolve with the complete data
          } else if (data.isCompleted && data.hasFailed) {
            reject(new Error('Failed to decode file'));
          } else if (Date.now() - start >= timeout) {
            reject(new Error('Polling timed out'));
          } else {
            setTimeout(poll, interval * 1000);
          }
          // eslint-disable-next-line no-unused-vars
        } catch (error) {
          if (Date.now() - start >= timeout) {
            reject(new Error('Polling timed out'));
          } else {
            setTimeout(poll, interval * 1000);
          }
        }
      };
      poll();
    });
  }

  /**
   * Decode the slave file and return the decoded information
   * @param decodeFileServiceDto {object}
   * @returns
   */
  async decodeFile(decodeFileServiceDto: DecodeKess3FileDto) {
    let slotGUID = null;
    const token = await this.getToken(decodeFileServiceDto.adminId);
    try {
      if (!fs.existsSync(decodeFileServiceDto.filePath)) {
        throw new Error('Decoded File not found');
      }
      //upload for encoded file
      const uploadInfo = await this.uploadEncodedFile(
        decodeFileServiceDto.uniqueId,
        decodeFileServiceDto.filePath,
        decodeFileServiceDto.adminId,
        { name: decodeFileServiceDto.name, email: decodeFileServiceDto.email },
        token,
      );
      //resolve async operation
      const { guid } = uploadInfo;

      console.log('uploadInfo', uploadInfo);

      slotGUID = uploadInfo.slotGUID;
      const asyncInformation = await this.resolveAsyncOperation(
        decodeFileServiceDto.adminId,
        uploadInfo.recommendedPollingInterval,
        60000,
        guid,
        token,
      );
      //save the file
      const decodedFile = await this.downloadDecodeFile(
        decodeFileServiceDto.adminId,
        decodeFileServiceDto.tempFileId,
        asyncInformation.slotGUID,
        asyncInformation.result.kess3Mode,
        asyncInformation.result.bootBenchComponents,
        token,
      );
      await this.closeFileSlot(decodeFileServiceDto.adminId, asyncInformation.slotGUID, token);

      //update decoded file path to request object
      return {
        mode: asyncInformation.result.kess3Mode,
        isCVNCorrectionPossible: asyncInformation.result.isCVNCorrectionPossible,
        fileSlotGUID: asyncInformation.slotGUID,
        fileType: decodedFile.fileType,
        decodedFilePath: decodedFile.filePath,
        decodedFileName: decodedFile.name,
        filePath: decodeFileServiceDto.filePath,
        filename: decodeFileServiceDto.name,
        uniqueId: decodeFileServiceDto.uniqueId,
      };
    } catch (error) {
      console.log(error.response);
      if (slotGUID) {
        await this.closeFileSlot(decodeFileServiceDto.adminId, slotGUID, token);
      }
      if (decodeFileServiceDto.filePath && fs.existsSync(decodeFileServiceDto.filePath)) {
        fs.unlinkSync(decodeFileServiceDto.filePath);
      }
      throw error;
    }
  }

  private async uploadModifiedFile(
    adminId: Types.ObjectId,
    uniqueId: string,
    fileSlotGUID: string,
    fileType: string,
    modifiedFilePath: string,
    token: string,
  ) {
    const formData = new FormData();
    console.log('modified file path from upload modified file', modifiedFilePath);
    formData.append('file', fs.createReadStream(modifiedFilePath));
    const apiService = this.apiService(adminId, token);
    const response = await apiService({
      method: 'put',
      url: `/api/kess3/upload-modified-file/${uniqueId}/${fileSlotGUID}/${fileType}`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
    });
    return response.data;
  }

  /**
   * Encode the modified file and return the encoded information
   * @param encodePayload
   * @param adminId
   * @returns
   */
  async encodeFile(encodePayload: EncodeKess3FileDto, adminId: Types.ObjectId) {
    let fileType = '';
    if (encodePayload.mode === 'BootBench') {
      if (encodePayload.fileType === 'BootBenchDecodedFlash') {
        fileType = 'BootBenchModifiedFlash';
      } else if (encodePayload.fileType === 'BootBenchDecodedMicro') {
        fileType = 'BootBenchModifiedMicro';
      }
    } else if (encodePayload.mode === 'OBD') {
      fileType = 'OBDModified';
    }

    const token = await this.getToken(adminId);

    //re open the file slot guid
    await this.reOpenFileSlot(adminId, encodePayload.fileSlotGUID, token);
    console.log('re-opened');
    console.log('modified file', encodePayload.filePath);

    const modifiedUploadedData = await this.uploadModifiedFile(
      adminId,
      encodePayload.uniqueId,
      encodePayload.fileSlotGUID,
      fileType,
      encodePayload.filePath,
      token,
    );

    //update decoded file path to request object
    let response: AxiosResponse<any, any> = null;
    const apiService = this.apiService(adminId, token);
    if (encodePayload.mode === 'OBD') {
      response = await apiService({
        method: 'post',
        url: `/api/kess3/encode-obd-file`,
        data: {
          userCustomerCode: encodePayload.uniqueId,
          kess3FileSlotGUID: encodePayload.fileSlotGUID,
          modifiedFileGUID: modifiedUploadedData.guid,
          willCorrectCVN: encodePayload.isCVNCorrectionPossible,
        },
      });
    } else if (encodePayload.mode === 'BootBench') {
      response = await apiService({
        method: 'post',
        url: `/api/kess3/encode-boot-bench-file`,
        data: {
          userCustomerCode: encodePayload.uniqueId,
          kess3FileSlotGUID: encodePayload.fileSlotGUID,
          ...(fileType === 'BootBenchModifiedFlash'
            ? { flashFileGUID: modifiedUploadedData.guid }
            : { microFileGUID: modifiedUploadedData.guid }),
        },
      });
    }

    if (response) {
      const asyncInformation = await this.resolveAsyncOperation(
        adminId,
        response.data.recommendedPollingInterval,
        60000,
        response.data.guid,
        token,
      );
      console.log('encoded async information', asyncInformation);
      await this.closeFileSlot(adminId, encodePayload.fileSlotGUID, token);

      const encodedData = await this.downloadEncodeFile(
        adminId,
        encodePayload.fileServiceId,
        asyncInformation.slotGUID,
        asyncInformation.result.kess3FileGUID,
        token,
      );
      return encodedData.filePath;
    }
  }

  //====================service and axios config sections====================
  /**
   * Get access token from alien tech and save to credential collection
   * @param adminId
   * @returns
   */
  private async acquireToken(adminId: Types.ObjectId) {
    console.log('get access token');

    //pull credential from db
    const credential = await this.credentialService.findByAdmin(adminId, 'alienTech');
    //throw error if credential not found
    if (!credential) throw new BadRequestException('Alien Tech Credential not found');

    const response = await this.httpService.axiosRef.post('/api/access-tokens/request', {
      clientApplicationGUID: credential.alienTech.clientId,
      secretKey: credential.alienTech.clientSecret,
    });

    this.httpService.axiosRef.interceptors.request.use(
      async (config) => {
        // Get the token from a secure store (could be a database, environment variable, etc.)
        config.headers['X-Alientech-ReCodAPI-LLC'] = response.data.accessToken;

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    await this.credentialService.updateAlienTechAccessToken(adminId, response.data.accessToken);
    return response.data.accessToken;
  }

  /**
   * get token from the db
   * @param adminId
   * @returns
   */
  private async getToken(adminId: Types.ObjectId) {
    const credential = await this.credentialService.findByAdmin(adminId, 'alienTech');
    if (!credential) throw new BadRequestException('Alien Tech Credential not found');
    return credential.alienTech.accessToken;
  }

  //axios instances
  private apiService(adminId: Types.ObjectId, token: string) {
    // Add a request interceptor to attach the access token to requests

    this.httpService.axiosRef.interceptors.request.use(
      async (config) => {
        // Get the token from a secure store (could be a database, environment variable, etc.)
        if (token) {
          config.headers['X-Alientech-ReCodAPI-LLC'] = token;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Add a response interceptor to handle 401 errors
    this.httpService.axiosRef.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        try {
          if (error.response && error.response.data === 'IP_NOT_ALLOWED') {
            return Promise.reject(error);
          }
          if (error.response && error.response.status === '429') {
            return Promise.reject(error);
          }
        } catch (error) {
          console.log(error.response.data);
          throw error;
        }

        // If error status is 401 and retry flag is not set, attempt to refresh the token
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.acquireToken(adminId);
            console.log('new token saved===>', newToken);
            // Update the Authorization header and retry the original request
            originalRequest.headers['X-Alientech-ReCodAPI-LLC'] = newToken;

            return this.httpService.axiosRef(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      },
    );

    return this.httpService.axiosRef;
  }
}

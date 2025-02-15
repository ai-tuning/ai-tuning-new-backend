import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { join } from 'path';

@Injectable()
export class PathService {
  /**
   * Get ROOT path for scripts
   * @param adminId
   * @param makeType
   * @returns
   */
  getRootScriptPath(adminId: Types.ObjectId, makeType: string) {
    return join(process.cwd(), 'public', 'scripts', adminId.toString(), makeType);
  }

  /**
   * get complete script path for an admin
   * @param adminId
   * @param makeType
   * @param car
   * @param controller
   * @returns
   */
  getCompleteScriptPath(adminId: Types.ObjectId, makeType: string, car: string, controller: string) {
    return join(process.cwd(), 'public', 'scripts', adminId.toString(), makeType, car, controller);
  }

  /**
   * get complete super script path
   * @param makeType
   * @param car
   * @param controller
   * @returns
   */
  getCompleteSuperScriptPath(makeType: string, car: string, controller: string) {
    return join(process.cwd(), 'public', 'scripts', 'ai-scripts', makeType, car, controller);
  }

  /**
   * get temp file path where we download the file from cloud for local working
   * @param uniqueName
   * @returns
   */
  getTempFilePath(uniqueName: string) {
    return join(process.cwd(), 'public', 'temp', uniqueName);
  }

  /**
   * get file service path
   * @param adminId
   * @param uniqueName
   * @returns
   */
  getFileServicePath(adminId: Types.ObjectId | string, tempFileId: Types.ObjectId | string) {
    return join(process.cwd(), 'public', 'file-services', adminId.toString(), tempFileId.toString());
  }

  getCarLogoPath() {
    return join(process.cwd(), 'public', 'car-logos');
  }
}

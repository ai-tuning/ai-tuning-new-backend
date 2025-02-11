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
   * get decoded file path for slave file
   * @param uniqueName
   * @returns
   */
  getDecodedFilePath(uniqueName: any) {
    return join(process.cwd(), 'public', 'decoded', uniqueName.toString());
  }

  /**
   * get encoded file path for slave file
   * @param uniqueName
   * @returns
   */
  getEncodedFilePath(uniqueName: any) {
    return join(process.cwd(), 'public', 'encoded', uniqueName.toString());
  }

  /**
   * get solution file path
   * @param uniqueName
   * @returns
   */
  getSolutionPath(uniqueName: any) {
    return join(process.cwd(), 'public', 'solutions', uniqueName.toString());
  }
}

import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { join } from 'path';

@Injectable()
export class PathService {
  getRootScriptPath(adminId: Types.ObjectId, makeType: string) {
    return join(process.cwd(), 'public', 'scripts', adminId.toString(), makeType);
  }
  getCompleteScriptPath(adminId: Types.ObjectId, makeType: string, car: string, controller: string) {
    return join(process.cwd(), 'public', 'scripts', adminId.toString(), makeType, car, controller);
  }
  getCompleteSuperScriptPath(makeType: string, car: string, controller: string) {
    return join(process.cwd(), 'public', 'scripts', 'ai-scripts', makeType, car, controller);
  }
  getTempFilePath(uniqueName: string) {
    return join(process.cwd(), 'public', 'temp', uniqueName);
  }
}

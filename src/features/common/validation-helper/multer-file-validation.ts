import * as path from 'path';
import { BadRequestException } from '@nestjs/common';
const prohibitedExtensions = [
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.sh',
  '.msi',
  '.scr',
  '.vbs',
  '.ps1',
  '.jar',
  '.gadget',
  '.wsf',
  '.reg',
  '.apk',
  '.run',
  '.php',
  '.js',
  '.jsp',
  '.asp',
  '.aspx',
  '.pl',
  '.py',
  '.rb',
  '.cgi',
  '.htaccess',
  '.shtml',
  '.sql',
  '.db',
  '.mdb',
  '.accdb',
  '.tar',
  '.gz',
  '.7z',
  '.iso',
  '.doc',
  '.docm',
  '.xls',
  '.xlsm',
  '.ppt',
  '.pptm',
  '.dotm',
  '.xltm',
  '.html',
  '.htm',
  '.xml',
  '.svg',
  '.swf',
  '.dll',
  '.sys',
  '.drv',
  '.ovf',
  '.dmg',
  '.vmdk',
  '.vdi',
  '.bashrc',
  '.bash_profile',
  '.htpasswd',
];
export const fileFilter = (
  file: any,
  callback: (error: Error | null, acceptFile: boolean) => void,
  options: { acceptedMimeTypes: string[]; errorMessages: string },
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (prohibitedExtensions.includes(ext)) {
    callback(new BadRequestException('Invalid file type'), false);
  }
  if (options.acceptedMimeTypes.includes(file.mimetype)) {
    callback(null, true); // Accept the file
  } else {
    callback(new BadRequestException(options.errorMessages), false);
  }
};

export const makeUniqueFileName = (
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const extension = path.extname(file.originalname);
  const filename = `${file.originalname}-${uniqueSuffix}${extension}`;
  callback(null, filename);
};

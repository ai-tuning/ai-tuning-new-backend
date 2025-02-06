// src/multer/multer.module.ts
import { extname } from 'path';
import * as path from 'path';
import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule as NestMulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

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

@Module({})
export class MulterModule {
  static register(options: {
    destination: string;
    acceptedMimeTypes: string[];
    maxFileSize?: number;
    errorMessages: string;
  }) {
    return {
      module: MulterModule,
      imports: [
        NestMulterModule.register({
          dest: options.destination,
          fileFilter: (_req, file, callback) => {
            const ext = path.extname(file.originalname).toLowerCase();
            if (prohibitedExtensions.includes(ext)) {
              callback(new BadRequestException('Invalid file type'), false);
            }
            if (options.acceptedMimeTypes.includes(file.mimetype)) {
              callback(null, true); // Accept the file
            } else {
              callback(new BadRequestException(options.errorMessages), false);
            }
          },
          storage: diskStorage({
            destination: options.destination,
            filename: (_req, file, callback) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
              const parsed = path.parse(file.originalname);
              const filename = `${parsed.name}-${uniqueSuffix}${parsed.ext}`;
              callback(null, filename);
            },
          }),
        }),
      ],
      exports: [NestMulterModule],
    };
  }
}

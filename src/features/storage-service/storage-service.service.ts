import * as fs from 'fs';
import { Storage, File } from 'megajs';
import { Injectable } from '@nestjs/common';
import { appConfig } from '../config';

@Injectable()
export class StorageService {
  storage: Storage;
  constructor() {
    const config = appConfig();
    this.storage = new Storage({
      email: config.mega_email,
      password: config.mega_password,
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
  }

  /**
   * This function will check folder we create manually in mega
   * @param name
   * @returns
   */
  hasDir(name: string, storage: Storage) {
    const lowerCaseName = name.toLowerCase();
    const hasDir = storage.root.children.find((file) => file.name === lowerCaseName);
    return hasDir;
  }

  /**
   * create directory if not exist
   * @param parent
   * @param child
   * @returns
   */
  async createDir(name: string, storage: Storage) {
    const lowerCaseName = name.toLowerCase();
    const hasFolder = this.hasDir(lowerCaseName, storage);
    if (!hasFolder) {
      await storage.mkdir(lowerCaseName);
    }
  }
  /**
   * create and upload file on mega
   * @param file
   * @param dir
   * @returns
   */
  async upload(dirName: string, file: { name: string; size: number; path: string }) {
    const storage = this.storage;

    const lowerCaseName = dirName.toLowerCase();

    await this.createDir(lowerCaseName, storage);
    //find the parent

    const createdDir = storage.find((file) => file.name === lowerCaseName);
    //upload to the root
    const uploadStream = storage.upload({ name: file.name, size: file.size });

    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(uploadStream);

    const uploaded = await uploadStream.complete;

    //move to the child dir
    await uploaded.moveTo(createdDir);
    // return the link
    const link = await uploaded.link({});
    return link;
  }

  /**
   * Delete file using link and directory
   * @param dir
   * @param link
   */
  async delete(dirName: string, link: string) {
    const lowerCaseName = dirName.toLowerCase();
    const dir = this.storage.find((file) => file.name === lowerCaseName);
    const file = dir.children.find(async (file) => (await file.link({})) === link);
    await file.delete();
  }

  /**
   * Delete the entire folder
   * @param dirName
   */
  async deleteFolder(dirName: string) {
    const lowerCaseName = dirName.toLowerCase();
    const dir = this.storage.find((file) => file.name === lowerCaseName);
    await dir.delete();
  }

  async download(link: string) {
    const file = File.fromURL(link);
    await file.loadAttributes();

    const data = file.download({});
    return { name: file.name, data };
  }
}

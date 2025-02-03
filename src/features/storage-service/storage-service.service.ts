import * as fs from 'fs';
import { Storage, File } from 'megajs';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { appConfig } from '../config';
import { DIRECTORY_NAMES, DIRECTORY_NAMES_TYPE } from '../constant';

@Injectable()
export class StorageServiceService implements OnModuleInit {
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

  private async createGeneralDir() {
    await this.storage.ready;
    const imagesDir = this.storage.find((folder) => folder.name === DIRECTORY_NAMES.IMAGES);
    const filesDir = this.storage.find((folder) => folder.name === DIRECTORY_NAMES.FILES);
    if (!imagesDir) {
      await this.storage.root.mkdir(DIRECTORY_NAMES.IMAGES);
    }
    if (!filesDir) {
      await this.storage.root.mkdir(DIRECTORY_NAMES.FILES);
    }
  }

  /**
   * It will create base folder if not exist
   */
  onModuleInit() {
    this.createGeneralDir();
  }

  /**
   * This function will check 2 level folder some folder we create manually in mega
   * @param parent
   * @param child
   * @returns
   */
  hasDir(parent: DIRECTORY_NAMES_TYPE, child: string) {
    const parentLowerCase = parent.toLowerCase();
    const childLowerCase = child.toLowerCase();
    const parentDir = this.storage.root.children.find((folder) => folder.name === parentLowerCase);
    const hasChild = parentDir.children.find((folder) => folder.name === childLowerCase);
    return hasChild;
  }

  /**
   * create directory if not exist
   * @param parent
   * @param child
   * @returns
   */
  async createDir(parent: DIRECTORY_NAMES_TYPE, child: string) {
    await this.storage.ready;

    const childLowerCase = child.toLowerCase();
    const hasFolder = this.hasDir(parent, childLowerCase);
    if (!hasFolder) {
      const folder = this.storage.root.children.find((folder) => folder.name === parent);
      await folder.mkdir(childLowerCase);
      return folder.link({});
    }
  }
  /**
   * create and upload file on mega
   * @param filePath
   * @param file
   * @param dir
   * @returns
   */
  async upload(
    dir: { parent: DIRECTORY_NAMES_TYPE; child: string },
    filePath: string,
    file: { name: string; size: number },
  ) {
    const parent = dir.parent;
    const childLowerCase = dir.child.toLowerCase();
    await this.storage.ready;

    await this.createDir(parent, childLowerCase);
    //find the parent
    const parentDir = this.storage.find(parent);
    //find the child
    const childDir = parentDir.children.find((folder) => folder.name === childLowerCase);

    //upload to the root
    const uploadStream = this.storage.upload({ name: file.name, size: file.size });
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(uploadStream);

    const uploaded = await uploadStream.complete;

    //move to the child dir
    await uploaded.moveTo(childDir);
    // return the link
    return uploaded.link({});
  }

  /**
   * Delete file using link and directory
   * @param dir
   * @param link
   */
  async delete(dir: { parent: DIRECTORY_NAMES_TYPE; child: string }, link: string) {
    const parentLowerCase = dir.parent.toLowerCase();
    const childLowerCase = dir.child.toLowerCase();
    await this.storage.ready;

    const parentDir = this.storage.find(parentLowerCase);
    const childDir = parentDir.children.find((folder) => folder.name === childLowerCase);
    const file = childDir.children.find(async (file) => (await file.link({})) === link);

    await file.delete();
  }

  /**
   * Delete the entire folder
   * @param dir
   */
  async deleteFolder(dir: { parent: DIRECTORY_NAMES_TYPE; child: string }) {
    const parentLowerCase = dir.parent.toLowerCase();
    const childLowerCase = dir.child.toLowerCase();

    const parentDir = this.storage.find(parentLowerCase);
    const childDir = parentDir.children.find((folder) => folder.name === childLowerCase);

    await childDir.delete();
  }

  async download(link: string) {
    const file = File.fromURL(link);
    await file.loadAttributes();

    const data = file.download({});
    return { name: file.name, data };
  }
}

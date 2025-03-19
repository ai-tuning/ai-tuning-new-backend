import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import { appConfig } from '../config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  ListObjectsCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class StorageService {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    const config = appConfig();
    this.bucketName = config.s3_bucket_name;
    this.client = new S3Client({
      endpoint: config.s3_storage_url,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.s3_client_id,
        secretAccessKey: config.s3_client_secret,
      },
      region: 'US-central',
    });
  }
  /**
   * Upload a file to S3
   * @param dirName Folder name (acts as a prefix in S3)
   * @param file File object
   * @returns Public URL of the uploaded file
   */
  async upload(dirName: string, file: { name: string; path: string }) {
    const key = `${dirName}/${file.name}`;
    const fileContent = fs.createReadStream(file.path);

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: fileContent,
      },
    });
    await upload.done();
    return key;
  }

  /**
   * Upload a file to S3
   * @param dirName Folder name (acts as a prefix in S3)
   * @param file File object
   * @returns Public URL of the uploaded file
   */
  async bulkUpload(dirName: string, files: { name: string; path: string; keyIdentifier: string }[]) {
    const uploads = files.map(async (file) => {
      const key = `${dirName}/${file.name}`;
      const fileContent = fs.createReadStream(file.path);

      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: fileContent,
        },
      });
      await upload.done();
      return { key, keyIdentifier: file.keyIdentifier };
    });

    const data = await Promise.all(uploads);
    return data;
  }

  /**
   * Delete a file from S3
   * @param dirName Folder name (prefix in S3)
   * @param fileName Name of the file to delete
   */
  async delete(dirName: string, fileName: string) {
    const key = `${dirName}/${fileName}`;
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }

  /**
   * Delete an entire folder (S3 doesn't have real folders, so we delete all objects under the prefix)
   * @param dirName Folder name (prefix in S3)
   */
  async deleteFolder(dirName: string) {
    const listCommand = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: `${dirName}/`,
    });

    const { Contents } = await this.client.send(listCommand);
    if (!Contents) return;

    for (const object of Contents) {
      await this.delete(dirName, object.Key.replace(`${dirName}/`, ''));
    }
  }

  /**
   * Download a file from S3
   * @param dirName Folder name (prefix in S3)
   * @param fileName Name of the file
   * @returns Readable stream of the file
   */
  async download(key: string): Promise<Readable> {
    const { Body } = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
    return Body as Readable;
  }

  /**
   * Replace a file in S3.
   * @param dirName Folder name (acts as a prefix in S3)
   * @param file File object
   * @returns Public URL of the replaced file
   */
  async replace(dirName: string, file: { name: string; path: string }) {
    const key = `${dirName}/${file.name}`;

    // Delete the existing file (if it exists)
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      // If the file doesn't exist, the delete operation will throw an error.
      // We can safely ignore this error, as we're going to upload the new file anyway.
      if (error.name !== 'NoSuchKey') {
        throw error; // Re-throw other errors
      }
    }

    // Upload the new file
    const fileContent = fs.createReadStream(file.path);
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: fileContent,
      },
    });
    await upload.done();

    return key;
  }
}

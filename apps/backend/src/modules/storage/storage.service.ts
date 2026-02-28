import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

@Injectable()
export class StorageService {
  private s3: S3Client | null = null;
  private bucket: string = '';
  private publicBaseUrl: string = '';
  private useS3 = false;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT?.trim();
    const accessKey = process.env.S3_ACCESS_KEY_ID?.trim();
    const secretKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
    this.bucket = process.env.S3_BUCKET?.trim() ?? '';
    if (endpoint && accessKey && secretKey && this.bucket) {
      this.useS3 = true;
      this.s3 = new S3Client({
        endpoint,
        region: process.env.S3_REGION?.trim() || 'auto',
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
        forcePathStyle: true,
      });
      const base = (process.env.S3_PUBLIC_URL || '').trim().replace(/\/$/, '');
      this.publicBaseUrl = base || `${endpoint.replace(/\/$/, '')}/${this.bucket}`;
    }
  }

  /**
   * Upload a file. If S3 is configured, uploads to bucket; otherwise saves to local uploads/ folder.
   * @param buffer File contents
   * @param folder Folder/key prefix (e.g. 'blog-videos', 'products')
   * @param originalFilename Original name (used for extension)
   * @param mimeType Optional MIME type
   * @returns Public URL to the file
   */
  async upload(
    buffer: Buffer,
    folder: string,
    originalFilename: string,
    mimeType?: string,
  ): Promise<string> {
    const ext = originalFilename.includes('.')
      ? originalFilename.split('.').pop()?.toLowerCase() || 'bin'
      : 'bin';
    const name = `${uuidv4()}.${ext}`;
    const key = `${folder}/${name}`;

    if (this.useS3 && this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType || undefined,
        }),
      );
      return `${this.publicBaseUrl}/${key}`;
    }

    const uploadsRoot = join(process.cwd(), 'uploads');
    const dir = join(uploadsRoot, folder);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name), buffer);
    return `/uploads/${folder}/${name}`;
  }
}

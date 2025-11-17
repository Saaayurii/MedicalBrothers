/**
 * File Upload Library
 * Handles file uploads to cloud storage (Cloudinary/S3)
 */

import { logger } from './logger';

export interface UploadConfig {
  provider: 'cloudinary' | 's3' | 'local';
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  s3?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
  local?: {
    uploadDir: string;
  };
}

export interface UploadOptions {
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  publicAccess?: boolean;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  format?: string;
  size?: number;
  error?: string;
}

// Allowed file types for medical documents
export const ALLOWED_MEDICAL_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

// Maximum file size (10 MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * File Upload Service
 */
export class FileUploadService {
  private config: UploadConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = this.loadConfig();
    this.isConfigured = this.validateConfig();
  }

  private loadConfig(): UploadConfig {
    const provider = (process.env.UPLOAD_PROVIDER || 'local') as UploadConfig['provider'];

    return {
      provider,
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      },
      s3: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_S3_BUCKET || '',
      },
      local: {
        uploadDir: process.env.UPLOAD_DIR || './uploads',
      },
    };
  }

  private validateConfig(): boolean {
    if (this.config.provider === 'cloudinary') {
      const { cloudName, apiKey, apiSecret } = this.config.cloudinary!;
      if (!cloudName || !apiKey || !apiSecret) {
        logger.warn('Cloudinary not configured properly');
        return false;
      }
    } else if (this.config.provider === 's3') {
      const { accessKeyId, secretAccessKey, bucket } = this.config.s3!;
      if (!accessKeyId || !secretAccessKey || !bucket) {
        logger.warn('S3 not configured properly');
        return false;
      }
    }
    return true;
  }

  /**
   * Validate file
   */
  private validateFile(
    file: File,
    options: UploadOptions
  ): { valid: boolean; error?: string } {
    const maxSize = options.maxSize || MAX_FILE_SIZE;
    const allowedTypes = options.allowedTypes || ALLOWED_MEDICAL_TYPES;

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }

    return { valid: true };
  }

  /**
   * Upload file to Cloudinary
   */
  private async uploadToCloudinary(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      // TODO: Implement Cloudinary upload
      // import { v2 as cloudinary } from 'cloudinary';
      //
      // cloudinary.config({
      //   cloud_name: this.config.cloudinary!.cloudName,
      //   api_key: this.config.cloudinary!.apiKey,
      //   api_secret: this.config.cloudinary!.apiSecret,
      // });
      //
      // const buffer = await file.arrayBuffer();
      // const base64 = Buffer.from(buffer).toString('base64');
      // const dataURI = `data:${file.type};base64,${base64}`;
      //
      // const result = await cloudinary.uploader.upload(dataURI, {
      //   folder: options.folder || 'medical-documents',
      //   resource_type: 'auto',
      // });
      //
      // return {
      //   success: true,
      //   url: result.secure_url,
      //   publicId: result.public_id,
      //   format: result.format,
      //   size: result.bytes,
      // };

      logger.info('File uploaded to Cloudinary (simulated)', {
        fileName: file.name,
        size: file.size,
        folder: options.folder,
      });

      return {
        success: true,
        url: `https://res.cloudinary.com/${this.config.cloudinary!.cloudName}/image/upload/${options.folder}/${file.name}`,
        publicId: `${options.folder}/${file.name}`,
        format: file.type.split('/')[1],
        size: file.size,
      };
    } catch (error) {
      logger.error('Failed to upload to Cloudinary', error as Error);
      return {
        success: false,
        error: 'Failed to upload file to cloud storage',
      };
    }
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      // TODO: Implement S3 upload
      // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
      //
      // const s3Client = new S3Client({
      //   region: this.config.s3!.region,
      //   credentials: {
      //     accessKeyId: this.config.s3!.accessKeyId,
      //     secretAccessKey: this.config.s3!.secretAccessKey,
      //   },
      // });
      //
      // const buffer = await file.arrayBuffer();
      // const key = `${options.folder || 'uploads'}/${Date.now()}-${file.name}`;
      //
      // await s3Client.send(
      //   new PutObjectCommand({
      //     Bucket: this.config.s3!.bucket,
      //     Key: key,
      //     Body: Buffer.from(buffer),
      //     ContentType: file.type,
      //     ACL: options.publicAccess ? 'public-read' : 'private',
      //   })
      // );
      //
      // const url = `https://${this.config.s3!.bucket}.s3.${this.config.s3!.region}.amazonaws.com/${key}`;
      //
      // return {
      //   success: true,
      //   url,
      //   publicId: key,
      //   format: file.type.split('/')[1],
      //   size: file.size,
      // };

      logger.info('File uploaded to S3 (simulated)', {
        fileName: file.name,
        size: file.size,
        folder: options.folder,
      });

      const key = `${options.folder || 'uploads'}/${Date.now()}-${file.name}`;
      return {
        success: true,
        url: `https://${this.config.s3!.bucket}.s3.${this.config.s3!.region}.amazonaws.com/${key}`,
        publicId: key,
        format: file.type.split('/')[1],
        size: file.size,
      };
    } catch (error) {
      logger.error('Failed to upload to S3', error as Error);
      return {
        success: false,
        error: 'Failed to upload file to S3',
      };
    }
  }

  /**
   * Upload file locally
   */
  private async uploadLocally(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      // TODO: Implement local file system upload
      // import fs from 'fs/promises';
      // import path from 'path';
      //
      // const uploadDir = path.join(
      //   this.config.local!.uploadDir,
      //   options.folder || 'uploads'
      // );
      //
      // await fs.mkdir(uploadDir, { recursive: true });
      //
      // const fileName = `${Date.now()}-${file.name}`;
      // const filePath = path.join(uploadDir, fileName);
      //
      // const buffer = await file.arrayBuffer();
      // await fs.writeFile(filePath, Buffer.from(buffer));
      //
      // return {
      //   success: true,
      //   url: `/uploads/${options.folder || 'uploads'}/${fileName}`,
      //   publicId: fileName,
      //   format: file.type.split('/')[1],
      //   size: file.size,
      // };

      logger.info('File uploaded locally (simulated)', {
        fileName: file.name,
        size: file.size,
        folder: options.folder,
      });

      const fileName = `${Date.now()}-${file.name}`;
      return {
        success: true,
        url: `/uploads/${options.folder || 'uploads'}/${fileName}`,
        publicId: fileName,
        format: file.type.split('/')[1],
        size: file.size,
      };
    } catch (error) {
      logger.error('Failed to upload locally', error as Error);
      return {
        success: false,
        error: 'Failed to upload file locally',
      };
    }
  }

  /**
   * Upload file
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    // Validate file
    const validation = this.validateFile(file, options);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Upload based on provider
    switch (this.config.provider) {
      case 'cloudinary':
        return this.uploadToCloudinary(file, options);
      case 's3':
        return this.uploadToS3(file, options);
      case 'local':
      default:
        return this.uploadLocally(file, options);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<boolean> {
    try {
      // TODO: Implement deletion based on provider
      // if (this.config.provider === 'cloudinary') {
      //   await cloudinary.uploader.destroy(publicId);
      // } else if (this.config.provider === 's3') {
      //   await s3Client.send(new DeleteObjectCommand({
      //     Bucket: this.config.s3!.bucket,
      //     Key: publicId,
      //   }));
      // } else {
      //   await fs.unlink(path.join(this.config.local!.uploadDir, publicId));
      // }

      logger.info('File deleted (simulated)', { publicId });
      return true;
    } catch (error) {
      logger.error('Failed to delete file', error as Error, { publicId });
      return false;
    }
  }

  /**
   * Get upload configuration
   */
  getConfig(): { provider: string; isConfigured: boolean } {
    return {
      provider: this.config.provider,
      isConfigured: this.isConfigured,
    };
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService();

/**
 * Helper function to convert File to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Helper function to get file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2);
}

/**
 * Helper function to format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

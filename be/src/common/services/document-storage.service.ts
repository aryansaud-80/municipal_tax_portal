import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

export interface StoredFile {
  storedPath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class DocumentStorageService {
  private readonly root: string;

  constructor(private readonly config: ConfigService) {
    this.root =
      this.config.get<string>('DOCUMENT_STORAGE_PATH') ?? './uploads/documents';
  }

  validate(mimeType: string, sizeBytes: number): void {
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new BadRequestException(
        'Only PDF, JPEG, PNG or WebP documents are accepted',
      );
    }
    if (sizeBytes > MAX_BYTES) {
      throw new BadRequestException('Document exceeds the 5 MB size limit');
    }
  }

  async save(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<StoredFile> {
    this.validate(mimeType, buffer.length);
    const safeExt = extname(originalName).slice(0, 10) || '.bin';
    const storedName = `${new Date().getFullYear()}/${randomUUID()}${safeExt}`;
    const fullPath = join(this.root, storedName);
    await fs.mkdir(join(this.root, new Date().getFullYear().toString()), {
      recursive: true,
    });
    await fs.writeFile(fullPath, buffer);
    return {
      storedPath: storedName,
      fileName: originalName.slice(0, 255),
      mimeType,
      sizeBytes: buffer.length,
    };
  }

  async read(
    storedPath: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const normalized = storedPath.replace(/\\/g, '/');
    if (normalized.includes('..')) {
      throw new BadRequestException('Invalid document path');
    }
    const fullPath = join(this.root, normalized);
    const buffer = await fs.readFile(fullPath);
    return { buffer, mimeType: 'application/octet-stream' };
  }
}

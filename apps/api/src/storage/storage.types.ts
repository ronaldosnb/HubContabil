export type UploadedFileInput = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type SaveFileInput = {
  clientId: string;
  file: UploadedFileInput;
};

export type SavedFile = {
  originalFileName: string;
  storedFileName: string;
  storagePath: string;
  mimeType: string;
  size: number;
};

export abstract class StorageService {
  abstract saveFile(input: SaveFileInput): Promise<SavedFile>;
  abstract getFile(storagePath: string): Promise<Buffer>;
  abstract getFilePath(storagePath: string): string;
  abstract deleteFile(storagePath: string): Promise<void>;
  abstract getFileUrl(storagePath: string): string;
  abstract moveFile(fromPath: string, toPath: string): Promise<void>;
}

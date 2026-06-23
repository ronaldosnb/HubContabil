import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import { basename, dirname, extname, isAbsolute, join, normalize } from "path";
import {
  SaveFileInput,
  SavedFile,
  StorageService
} from "./storage.types";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

const fallbackExtensionsByMimeType: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx"
};

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly root: string;
  private readonly maxSizeBytes: number;

  constructor(private readonly config: ConfigService) {
    this.root = this.config.get<string>("STORAGE_ROOT", "./storage");
    this.maxSizeBytes = Number(this.config.get<string>("MAX_UPLOAD_SIZE_MB", "20")) * 1024 * 1024;
  }

  async saveFile(input: SaveFileInput): Promise<SavedFile> {
    this.validateFile(input.file);

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const extension =
      extname(input.file.originalname).toLowerCase() ||
      fallbackExtensionsByMimeType[input.file.mimetype] ||
      "";
    const storedFileName = `${randomUUID()}${extension}`;
    const relativePath = join(
      "clients",
      input.clientId,
      "documents",
      year,
      month,
      storedFileName
    );
    const absolutePath = this.getFilePath(relativePath);

    await mkdir(join(this.root, "clients", input.clientId, "documents", year, month), {
      recursive: true
    });
    await writeFile(absolutePath, input.file.buffer);

    return {
      originalFileName: basename(input.file.originalname),
      storedFileName,
      storagePath: relativePath,
      mimeType: input.file.mimetype,
      size: input.file.size
    };
  }

  getFile(storagePath: string) {
    return readFile(this.getFilePath(storagePath));
  }

  getFilePath(storagePath: string) {
    const normalized = normalize(storagePath);

    if (normalized.startsWith("..") || isAbsolute(normalized)) {
      throw new BadRequestException("Caminho de arquivo inválido.");
    }

    return join(this.root, normalized);
  }

  async deleteFile(storagePath: string) {
    await rm(this.getFilePath(storagePath), { force: true });
  }

  getFileUrl(storagePath: string) {
    return `/api/documents/file?path=${encodeURIComponent(storagePath)}`;
  }

  async moveFile(fromPath: string, toPath: string) {
    await mkdir(dirname(this.getFilePath(toPath)), { recursive: true });
    await rename(this.getFilePath(fromPath), this.getFilePath(toPath));
  }

  private validateFile(file: SaveFileInput["file"]) {
    if (!file) {
      throw new BadRequestException("Arquivo obrigatório.");
    }

    if (!file.buffer || file.size <= 0) {
      throw new BadRequestException("Arquivo vazio ou inválido.");
    }

    if (file.size > this.maxSizeBytes) {
      throw new BadRequestException("Arquivo excede o limite permitido.");
    }

    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException("Tipo de arquivo não permitido.");
    }
  }
}

import assert from "node:assert/strict";
import test from "node:test";
import { ConfigService } from "@nestjs/config";
import { LocalStorageService } from "./local-storage.service";

test("local storage rejects path traversal", () => {
  const service = new LocalStorageService(
    new ConfigService({ STORAGE_ROOT: "./storage", MAX_UPLOAD_SIZE_MB: "20" })
  );

  assert.throws(() => service.getFilePath("../secret.pdf"), /Caminho de arquivo inválido/);
});

test("local storage resolves safe relative paths", () => {
  const service = new LocalStorageService(
    new ConfigService({ STORAGE_ROOT: "./storage", MAX_UPLOAD_SIZE_MB: "20" })
  );

  const path = service.getFilePath("clients/client-1/documents/2026/06/file.pdf");
  assert.ok(path.endsWith("storage/clients/client-1/documents/2026/06/file.pdf"));
});

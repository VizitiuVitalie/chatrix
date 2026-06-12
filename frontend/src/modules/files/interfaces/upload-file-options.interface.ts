export interface UploadFileOptions {
  file: File;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

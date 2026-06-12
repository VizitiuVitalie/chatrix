import { Readable } from 'node:stream';

export type ServeFileResult =
  | { mode: 'redirect'; url: string }
  | {
      mode: 'stream';
      stream: Readable;
      mimeType: string;
      downloadName: string;
    };

import {
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  File as FileIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

export function pickFileIcon(
  mimeType: string,
  className: string,
): ReactElement {
  if (mimeType.startsWith('image/')) return <FileImage className={className} />;
  if (mimeType.startsWith('audio/')) return <FileAudio className={className} />;
  if (mimeType.startsWith('video/')) return <FileVideo className={className} />;
  if (mimeType.startsWith('text/')) return <FileText className={className} />;
  return <FileIcon className={className} />;
}

export interface SendMessageRequest {
  chatId: number;
  content?: string;
  fileIds?: number[];
  clientId?: string;
}

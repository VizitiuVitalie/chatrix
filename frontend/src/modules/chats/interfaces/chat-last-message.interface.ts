export interface ChatLastMessage {
  id: number;
  senderId: number;
  senderNickname: string;
  content: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

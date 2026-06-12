export interface ChatActivityEmitter {
  notifyTyping: () => void;
  stopTyping: () => void;
  setUploading: (uploading: boolean) => void;
}

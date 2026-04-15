export type MessageRole = 'user' | 'assistant';

export interface AttachedFile {
  name: string;
  type: string;
  dataUrl: string; // object URL or data URL — for preview only
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  file?: AttachedFile;
  isStreaming?: boolean;
}

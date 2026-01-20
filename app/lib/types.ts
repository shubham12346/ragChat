// Database schema types

export interface Document {
  id: string;
  name: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at: Date;
}

export interface Chunk {
  id: string;
  document_id: string;
  content: string;
  embedding: number[]; // Vector(1536)
  chunk_index: number;
  created_at: Date;
}

export interface ChatSession {
  id: string;
  title?: string | null;
  created_at: Date;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: Date;
}

// Type for citations used in responses
export type Citation = {
  index: number;
  chunkId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
};

import { getEncoding } from "js-tiktoken";

const encoder = getEncoding("cl100k_base");

export type TextChunk = {
  content: string;
  chunkIndex: number;
};

type ChunkOptions = {
  chunkSize?: number;
  overlap?: number;
};

export function chunkText(text: string, options: ChunkOptions = {}) {
  const chunkSize = options.chunkSize ?? 500;
  const overlap = options.overlap ?? 100;

  if (overlap >= chunkSize) {
    throw new Error("Overlap must be smaller than chunk size");
  }

  // Normalize text
  const cleanText = text
    .replaceAll("\r\n", "\n")
    .replaceAll(/\n{3,}/g, "\n\n")

    .trim();

  const tokens = encoder.encode(cleanText);
  const chunks: TextChunk[] = [];

  let start = 0;
  let chunkIndex = 0;

  while (start < tokens.length) {
    const end = start + chunkSize;
    const chunkTokens = tokens.slice(start, end);
    const content = encoder.decode(chunkTokens);

    chunks.push({
      content,
      chunkIndex,
    });

    chunkIndex++;
    start += chunkSize - overlap;
  }
  return chunks;
}

import { embed } from "ai";
import { openai } from "@ai-sdk/openai";

export async function getEmbedding(text: string): Promise<number[]> {
  if (text.trim().length === 0) {
    throw new Error("Text for embedding cannot be empty");
  }

  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text,
  });

  return embedding;
}

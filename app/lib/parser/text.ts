export async function textParser(buffer: Buffer): Promise<string> {
  const text = buffer.toString("utf-8");
  console.log("Parsed text:", text.slice(0, 100)); // Log first 100 characters
  return text;
}

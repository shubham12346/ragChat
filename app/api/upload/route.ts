import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { pool } from "@/app/lib/db";
import { textParser } from "@/app/lib/parser/text";
import { chunkText } from "@/app/lib/chunker";
import { getEmbedding } from "@/app/lib/embedding";
import { pdfParser } from "@/app/lib/parser/pdf";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();

    let text = "";

    if (fileName.endsWith(".txt")) {
      text = await textParser(buffer);
    } else if (fileName.endsWith(".pdf")) {
      text = await pdfParser(buffer);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Parsed text is empty" },
        { status: 400 }
      );
    }

    // create document record;

    const documentId = uuidv4();
    const sessionId = uuidv4();

    await pool.query("INSERT INTO documents (id, name) VALUES ($1, $2)", [
      documentId,
      file.name,
    ]);

    await pool.query(
      "INSERT INTO chat_sessions (id, document_id) VALUES ($1, $2)",
      [sessionId, documentId]
    );

    console.log("Document record created with ID:", documentId);

    const chunks = chunkText(text, { chunkSize: 500, overlap: 100 });
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.content);
      // Convert array to string format required by pgvector: [1,2,3,...]
      const embeddingString = `[${embedding.join(',')}]`;

      await pool.query(
        `INSERT INTO chunks (id,document_id,content,embedding,chunk_index) VALUES ($1, $2, $3, $4::vector, $5)`,
        [uuidv4(), documentId, chunk.content, embeddingString, chunk.chunkIndex]
      );
    }
    return NextResponse.json({
      message: "File uploaded and processed successfully",
      documentId,
      sessionId,
      chunksStored: chunks.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error during file upload" },
      { status: 500 }
    );
  }
}

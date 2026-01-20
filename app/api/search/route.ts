import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";
import { getEmbedding } from "@/app/lib/embedding";

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Query cannot be empty" },
      { status: 400 }
    );
  }

  try {
    const queryEmbedding = await getEmbedding(query);
    // Convert array to string format required by pgvector: [1,2,3,...]
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    const result = await pool.query(
      `SELECT chunks.content,chunks.document_id,documents.name as document_name,chunks.embedding <=> $1::vector AS similarity
        FROM chunks
        JOIN documents ON chunks.document_id = documents.id
        ORDER BY similarity ASC ;`,
      [embeddingString]
    );

    console.log("Search results:", result.rows);
    return NextResponse.json({
      query,
      results: result.rows,
    });
  } catch (error) {
    console.error("Error during search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

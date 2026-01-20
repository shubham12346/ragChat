import { NextRequest, NextResponse } from "next/server";
import { validate as uuidValidate } from "uuid";
import { pool } from "@/app/lib/db";
import { openai } from "@/app/lib/openai";
import { getEmbedding } from "@/app/lib/embedding";
import { streamText } from "ai";
import { getChatHistory } from "@/app/lib/chat/history";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, id, messages } = await req.json();
    console.log("sessionId", sessionId ?? id);
    console.log("messages", messages);
    
    const providedSessionId = sessionId || id;

    // Validate message
    if (!messages || messages.length === 0 || !providedSessionId) {
      return NextResponse.json(
        { error: "Messages and sessionId are required" },
        { status: 400 }
      );
    }
    
    // Validate session ID; DB expects a UUID
    if (!uuidValidate(providedSessionId)) {
      return NextResponse.json(
        { error: "Invalid sessionId" },
        { status: 400 }
      );
    }

    const currentSessionId = providedSessionId;
    console.log("Using session ID:", currentSessionId);

    // Ensure the session belongs to a document before proceeding
    const sessionRow = await pool.query(
      `
      SELECT document_id FROM chat_sessions WHERE id = $1
      `,
      [currentSessionId]
    );

    if (sessionRow.rows.length === 0) {
      return NextResponse.json(
        { error: "Session not found. Please upload a document." },
        { status: 404 }
      );
    }

    const documentId = sessionRow.rows[0].document_id as string;

    // Extract text from the last message's parts array
    const lastMessage = messages[messages.length - 1];
    const textPart = lastMessage.parts?.find((part: any) => part.type === 'text');
    const messageText = textPart?.text || lastMessage.content || '';
    
    if (!messageText) {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    await pool.query(
      ` INSERT INTO chat_messages (id, session_id, role, content) VALUES (gen_random_uuid(), $1, 'user', $2)`,
      [currentSessionId, messageText]
    );

    const history = await pool.query(
      ` SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC `,
      [currentSessionId]
    );

    
    // Convert database history to message format for LLM
    const historyMessages = history.rows.map((row: { role: string; content: string }) => ({
      role: row.role as "user" | "assistant" | "system",
      content: row.content,
    }));
    
    console.log("history messages--------", historyMessages);
    const queryEmbedding = await getEmbedding(messageText);
    // Convert array to string format required by pgvector: [1,2,3,...]
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    const retrieved = await pool.query(
      `
    SELECT chunks.content, documents.name, chunks.chunk_index
    FROM chunks
    JOIN documents ON documents.id = chunks.document_id
    WHERE documents.id = $2
    ORDER BY chunks.embedding <=> $1::vector
    LIMIT 5
    `,
      [embeddingString, documentId]
    );

    console.log("retrieved--------", retrieved);
    const context = retrieved.rows
      .map(
        (r, i) => `[${i + 1}] (${r.name}, chunk ${r.chunk_index})\n${r.content}`
      )
      .join("\n\n");

    console.log("context--------", context);
    // 3️⃣ Stream LLM response
    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: `
You are a helpful assistant.
Answer ONLY using the context below.
If the answer is not present, say "I don't know".

Context:
${context}
        `,
        },
        ...historyMessages,
      ],

      // ✅ THIS is where onFinish belongs
      onFinish: async ({ text, finishReason }) => {
        console.log("Chat finished:", finishReason);

        // Optional: save assistant message
        await pool.query(
          `
        INSERT INTO chat_messages (id, session_id, role, content)
        VALUES (gen_random_uuid(), $1, 'assistant', $2)
        `,
          [currentSessionId, text]
        );
      },
    });

    console.log("result--------", result);
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error during chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  console.log("sessionId--------", sessionId);
  const isValidUuid =
    !!sessionId &&
    sessionId !== "null" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      sessionId
    );
  if (!isValidUuid) {
    return NextResponse.json(
      { error: "Valid session ID is required" },
      { status: 400 }
    );
  }
  const history = await getChatHistory(sessionId);
  return NextResponse.json(history);
}
import { pool } from "@/app/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {
  await pool.query(
    `
    INSERT INTO chat_messages (id, session_id, role, content)
    VALUES ($1, $2, $3, $4)
    `,
    [uuidv4(), sessionId, role, content]
  );
}

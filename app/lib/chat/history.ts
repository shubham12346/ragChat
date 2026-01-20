import { pool } from "@/app/lib/db";

export async function getChatHistory(sessionId: string) {
  const { rows } = await pool.query(
    `
   SELECT role, content, citations
FROM chat_messages
WHERE session_id = $1
ORDER BY created_at ASC
    `,
    [sessionId]
  );

  return rows;
}
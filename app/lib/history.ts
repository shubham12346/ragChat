import { pool } from "./db";
export async function getHistory(sessionId: string) { 
    const {rows} = await pool.query(
        `SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
        [sessionId]
    );
    return rows;
}
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export async function GET(request: Request) { 
    const rows = await pool.query("SELECT * FROM chat_sessions");
    console.log("rows--------", rows.rows);
    return NextResponse.json(rows.rows);
}
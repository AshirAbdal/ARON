import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM categories ORDER BY name ASC');
  return NextResponse.json({ categories: rows });
}

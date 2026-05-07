import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM categories ORDER BY name ASC');
    return NextResponse.json({ categories: rows });
  } catch (err) {
    console.error('[categories] GET error:', err);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}

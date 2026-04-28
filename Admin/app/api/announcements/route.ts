import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function GET() {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, message, is_active, sort_order, starts_at, ends_at, created_at
       FROM announcements
      ORDER BY sort_order ASC, created_at DESC`
  );
  return NextResponse.json({ announcements: rows });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message || '').trim();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (message.length > 200) {
      return NextResponse.json(
        { error: 'Message must be 200 characters or fewer' },
        { status: 400 }
      );
    }

    const sort_order = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0;
    const is_active = body.is_active === false || body.is_active === 0 ? 0 : 1;
    const starts_at: string | null = body.starts_at || null;
    const ends_at: string | null = body.ends_at || null;

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO announcements (message, is_active, sort_order, starts_at, ends_at) VALUES (?, ?, ?, ?, ?)',
      [message, is_active, sort_order, starts_at, ends_at]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = 'SELECT * FROM orders WHERE 1=1';
  const params: (string | number)[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const countParams = status ? [status] : [];
  const [[orders], [countRows]] = await Promise.all([
    pool.execute<RowDataPacket[]>(query, params),
    pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as c FROM orders${status ? ' WHERE status = ?' : ''}`,
      countParams
    ),
  ]);

  return NextResponse.json({ orders, total: (countRows[0] as { c: number }).c });
  } catch (err) {
    console.error('[api/orders GET]', err);
    return NextResponse.json({ error: 'Failed to fetch orders', orders: [], total: 0 }, { status: 500 });
  }
}

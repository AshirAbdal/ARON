import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// Public list of currently-live announcements for the top bar.
export async function GET() {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT message
       FROM announcements
      WHERE is_active = 1
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at   IS NULL OR ends_at   >  NOW())
      ORDER BY sort_order ASC, created_at DESC
      LIMIT 20`
  );

  return NextResponse.json(
    { announcements: (rows as { message: string }[]).map((r) => r.message) },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}

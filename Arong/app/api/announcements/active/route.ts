import { NextResponse } from 'next/server';
import db from '@/lib/db';

interface AnnouncementRow {
  message: string;
}

// Public list of currently-live announcements for the top bar.
export async function GET() {
  const rows = db
    .prepare(
      `SELECT message
         FROM announcements
        WHERE is_active = 1
          AND (starts_at IS NULL OR starts_at <= datetime('now'))
          AND (ends_at   IS NULL OR ends_at   >  datetime('now'))
        ORDER BY sort_order ASC, created_at DESC
        LIMIT 20`
    )
    .all() as AnnouncementRow[];

  return NextResponse.json(
    { announcements: rows.map((r) => r.message) },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}

import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Public list of currently usable coupons for the announcement bar.
// Only safe, non-sensitive fields are exposed.
export async function GET() {
  const coupons = db
    .prepare(
      `SELECT code, discount_type, discount_value, min_order, expires_at
         FROM coupons
        WHERE is_active = 1
          AND (max_uses IS NULL OR used_count < max_uses)
          AND (expires_at IS NULL OR expires_at > datetime('now'))
        ORDER BY discount_value DESC
        LIMIT 20`
    )
    .all();

  return NextResponse.json(
    { coupons },
    {
      headers: {
        // Cache at the edge for 60s to keep the bar snappy.
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}

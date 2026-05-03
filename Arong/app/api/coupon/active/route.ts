import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

// Public list of currently usable coupons for the announcement bar.
// Only safe, non-sensitive fields are exposed.
export async function GET() {
  const [coupons] = await pool.execute<RowDataPacket[]>(
    `SELECT code, discount_type, discount_value, min_order, expires_at
       FROM coupons
      WHERE is_active = 1
        AND (max_uses IS NULL OR used_count < max_uses)
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY discount_value DESC
      LIMIT 20`
  );

  return NextResponse.json(
    { coupons },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}

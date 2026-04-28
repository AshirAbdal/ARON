import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
  const [[p], [o], [po], [rev], [recentOrders]] = await Promise.all([
    pool.execute<RowDataPacket[]>('SELECT COUNT(*) as c FROM products'),
    pool.execute<RowDataPacket[]>('SELECT COUNT(*) as c FROM orders'),
    pool.execute<RowDataPacket[]>("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'"),
    pool.execute<RowDataPacket[]>("SELECT COALESCE(SUM(total), 0) as r FROM orders WHERE status != 'cancelled'"),
    pool.execute<RowDataPacket[]>('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10'),
  ]);

  return NextResponse.json({
    totalProducts: (p[0] as { c: number }).c,
    totalOrders: (o[0] as { c: number }).c,
    pendingOrders: (po[0] as { c: number }).c,
    revenue: (rev[0] as { r: number }).r,
    recentOrders,
  });
}

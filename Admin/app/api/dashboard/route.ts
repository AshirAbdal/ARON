import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const totalProducts = (db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }).c;
  const totalOrders = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c;
  const pendingOrders = (
    db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get() as { c: number }
  ).c;
  const revenue = (
    db
      .prepare("SELECT COALESCE(SUM(total), 0) as r FROM orders WHERE status != 'cancelled'")
      .get() as { r: number }
  ).r;

  const recentOrders = db
    .prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10')
    .all();

  return NextResponse.json({ totalProducts, totalOrders, pendingOrders, revenue, recentOrders });
}

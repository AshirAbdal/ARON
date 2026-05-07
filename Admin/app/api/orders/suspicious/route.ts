import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

let ensured = false;

async function ensureSuspiciousTable(): Promise<void> {
  if (ensured) return;

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS suspicious_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT,
      order_number VARCHAR(50),
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255),
      ip VARCHAR(100),
      score INT NOT NULL DEFAULT 0,
      reasons_json TEXT NOT NULL,
      review_status VARCHAR(20) NOT NULL DEFAULT 'pending',
      reviewed_by VARCHAR(100),
      reviewed_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT NOW(),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    )
  `);

  ensured = true;
}

export async function GET(req: NextRequest) {
  try {
  await ensureSuspiciousTable();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('review_status') || 'pending';
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT so.id, so.order_id, so.order_number, so.full_name, so.phone, so.email,
            so.ip, so.score, so.reasons_json, so.review_status, so.created_at,
            o.total, o.status AS order_status
       FROM suspicious_orders so
       LEFT JOIN orders o ON o.id = so.order_id
      WHERE (? = '' OR so.review_status = ?)
      ORDER BY so.created_at DESC
      LIMIT ?`,
    [status, status, limit]
  );

  return NextResponse.json({ suspiciousOrders: rows });
  } catch (err) {
    console.error('[api/orders/suspicious GET]', err);
    return NextResponse.json({ error: 'Failed to fetch suspicious orders', suspiciousOrders: [] }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await ensureSuspiciousTable();
  const body = (await req.json()) as {
    id?: number;
    review_status?: 'pending' | 'approved' | 'blocked';
  };

  if (!body.id || !body.review_status || !['pending', 'approved', 'blocked'].includes(body.review_status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  await pool.execute(
    `UPDATE suspicious_orders
        SET review_status = ?, reviewed_at = NOW()
      WHERE id = ?`,
    [body.review_status, body.id]
  );

  return NextResponse.json({ success: true });
}

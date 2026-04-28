import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const [orderRows] = await pool.execute<RowDataPacket[]>('SELECT * FROM orders WHERE id = ?', [params.id]);
  const order = orderRows[0];
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [items] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM order_items WHERE order_id = ?',
    [(order as { id: number }).id]
  );

  return NextResponse.json({ order, items });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { status } = await req.json();
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, params.id]);
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(params.id);
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const items = db
    .prepare('SELECT * FROM order_items WHERE order_id = ?')
    .all((order as { id: number }).id);

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

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, params.id);
  return NextResponse.json({ success: true });
}

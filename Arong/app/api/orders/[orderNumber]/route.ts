import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  const order = db
    .prepare('SELECT * FROM orders WHERE order_number = ?')
    .get(params.orderNumber);

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const items = db
    .prepare('SELECT * FROM order_items WHERE order_id = ?')
    .all((order as { id: number }).id);

  return NextResponse.json({ order, items });
}

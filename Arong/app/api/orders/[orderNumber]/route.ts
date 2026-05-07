import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const [orderRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM orders WHERE order_number = ?',
      [params.orderNumber]
    );
    const order = orderRows[0];

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const [items] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM order_items WHERE order_id = ?',
      [(order as { id: number }).id]
    );

    return NextResponse.json({ order, items });
  } catch (err) {
    console.error('[orders/orderNumber] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

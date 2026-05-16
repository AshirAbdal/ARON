import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [productRows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? OR p.slug = ?`,
      [params.id, params.id]
    );
    const product = productRows[0];

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const [[images], [variants]] = await Promise.all([
      pool.execute<RowDataPacket[]>(
        'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC',
        [(product as { id: number }).id]
      ),
      pool.execute<RowDataPacket[]>(
        'SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC',
        [(product as { id: number }).id]
      ),
    ]);

    return NextResponse.json({ product, images, variants });
  } catch (err) {
    console.error('[products/id] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

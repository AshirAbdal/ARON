import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? OR p.slug = ?`
    )
    .get(params.id, params.id);

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const images = db
    .prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC')
    .all((product as { id: number }).id);

  const variants = db
    .prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC')
    .all((product as { id: number }).id);

  return NextResponse.json({ product, images, variants });
}

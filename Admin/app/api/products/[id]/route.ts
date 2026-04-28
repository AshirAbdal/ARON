import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const [productRows] = await pool.execute<RowDataPacket[]>('SELECT * FROM products WHERE id = ?', [params.id]);
  const product = productRows[0];
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      name, description, price_min, price_max, brand, category_id,
      audience = 'unisex',
      is_new_arrival, is_featured, free_delivery, discount_label,
      stock, notes, images = [], variants = [],
    } = body;

    const ALLOWED_AUDIENCE = ['men', 'women', 'baby', 'unisex'];
    const audienceValue = ALLOWED_AUDIENCE.includes(audience) ? audience : 'unisex';

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(`
        UPDATE products SET
          name = ?, description = ?, price_min = ?, price_max = ?,
          brand = ?, category_id = ?, audience = ?,
          is_new_arrival = ?, is_featured = ?,
          free_delivery = ?, discount_label = ?, stock = ?, notes = ?
        WHERE id = ?
      `, [
        name, description || null, price_min, price_max || null,
        brand || null, category_id || null, audienceValue,
        is_new_arrival ? 1 : 0,
        is_featured ? 1 : 0, free_delivery ? 1 : 0, discount_label || null,
        stock, notes || null, params.id,
      ]);

      if (images.length > 0) {
        await conn.execute('DELETE FROM product_images WHERE product_id = ?', [params.id]);
        for (let i = 0; i < images.length; i++) {
          await conn.execute(
            'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
            [params.id, images[i].url, i === 0 ? 1 : 0]
          );
        }
      }

      await conn.execute('DELETE FROM product_variants WHERE product_id = ?', [params.id]);
      for (const v of variants) {
        await conn.execute(
          'INSERT INTO product_variants (product_id, name, price, stock) VALUES (?, ?, ?, ?)',
          [params.id, v.name, v.price, v.stock || 100]
        );
      }

      await conn.commit();
      return NextResponse.json({ success: true });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await pool.execute('DELETE FROM products WHERE id = ?', [params.id]);
  return NextResponse.json({ success: true });
}

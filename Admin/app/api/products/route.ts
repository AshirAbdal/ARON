import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const audience = searchParams.get('audience') || '';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const ALLOWED_AUDIENCE = ['men', 'women', 'baby', 'unisex'];
  const audienceFilter = audience && ALLOWED_AUDIENCE.includes(audience) ? audience : '';

  let query = `
    SELECT p.*, c.name as category_name,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (search) {
    query += ' AND (p.name LIKE ? OR p.brand LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    query += ' AND p.category_id = ?';
    params.push(parseInt(category));
  }
  if (audienceFilter) {
    query += ' AND p.audience = ?';
    params.push(audienceFilter);
  }

  const countParams = [...params];
  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  let countQuery = `SELECT COUNT(*) as c FROM products p WHERE 1=1`;
  if (search) countQuery += ' AND (p.name LIKE ? OR p.brand LIKE ?)';
  if (category) countQuery += ' AND p.category_id = ?';
  if (audienceFilter) countQuery += ' AND p.audience = ?';

  const [[products], [countRows]] = await Promise.all([
    pool.execute<RowDataPacket[]>(query, params),
    pool.execute<RowDataPacket[]>(countQuery, countParams),
  ]);

  return NextResponse.json({ products, total: (countRows[0] as { c: number }).c });
  } catch (err) {
    console.error('[api/products GET]', err);
    return NextResponse.json({ error: 'Failed to fetch products', products: [], total: 0 }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, description, price_min, price_max, brand, category_id,
      audience = 'unisex',
      is_new_arrival = 0, is_featured = 0, free_delivery = 0,
      discount_label, stock = 100, notes, images = [], variants = [],
    } = body;

    if (!name || !price_min) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const ALLOWED_AUDIENCE = ['men', 'women', 'baby', 'unisex'];
    const audienceValue = ALLOWED_AUDIENCE.includes(audience) ? audience : 'unisex';

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const uniqueSlug = `${slug}-${Date.now()}`;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [res] = await conn.execute<ResultSetHeader>(`
        INSERT INTO products (name, slug, description, price_min, price_max, brand, category_id, audience,
          is_new_arrival, is_featured, free_delivery, discount_label, stock, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name, uniqueSlug, description || null, price_min, price_max || null,
        brand || null, category_id || null, audienceValue,
        is_new_arrival ? 1 : 0,
        is_featured ? 1 : 0, free_delivery ? 1 : 0, discount_label || null,
        stock, notes || null,
      ]);

      const productId = res.insertId;

      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await conn.execute(
            'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
            [productId, images[i].url, i === 0 ? 1 : 0]
          );
        }
      } else {
        await conn.execute(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
          [productId, '/placeholder.jpg', 1]
        );
      }

      for (const v of variants) {
        await conn.execute(
          'INSERT INTO product_variants (product_id, name, price, stock) VALUES (?, ?, ?, ?)',
          [productId, v.name, v.price, v.stock || 100]
        );
      }

      await conn.commit();
      return NextResponse.json({ id: productId }, { status: 201 });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

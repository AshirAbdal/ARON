import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

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

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const products = db.prepare(query).all(...params);
  const total = (
    db.prepare(`SELECT COUNT(*) as c FROM products p WHERE 1=1${
      search ? ' AND (p.name LIKE ? OR p.brand LIKE ?)' : ''
    }${category ? ' AND p.category_id = ?' : ''}`).get(
      ...(search ? [`%${search}%`, `%${search}%`] : []),
      ...(category ? [parseInt(category)] : [])
    ) as { c: number }
  ).c;

  return NextResponse.json({ products, total });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, description, price_min, price_max, brand, category_id,
      is_new_arrival = 0, is_featured = 0, free_delivery = 0,
      discount_label, stock = 100, notes, images = [], variants = [],
    } = body;

    if (!name || !price_min) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const uniqueSlug = `${slug}-${Date.now()}`;

    const insertProduct = db.transaction(() => {
      const res = db.prepare(`
        INSERT INTO products (name, slug, description, price_min, price_max, brand, category_id,
          is_new_arrival, is_featured, free_delivery, discount_label, stock, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        name, uniqueSlug, description || null, price_min, price_max || null,
        brand || null, category_id || null, is_new_arrival ? 1 : 0,
        is_featured ? 1 : 0, free_delivery ? 1 : 0, discount_label || null,
        stock, notes || null
      );

      const productId = res.lastInsertRowid;

      if (images.length > 0) {
        const insertImg = db.prepare(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)'
        );
        images.forEach((img: { url: string; is_primary?: boolean }, i: number) => {
          insertImg.run(productId, img.url, i === 0 ? 1 : 0);
        });
      } else {
        db.prepare(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)'
        ).run(productId, '/placeholder.jpg', 1);
      }

      if (variants.length > 0) {
        const insertVariant = db.prepare(
          'INSERT INTO product_variants (product_id, name, price, stock) VALUES (?, ?, ?, ?)'
        );
        for (const v of variants) {
          insertVariant.run(productId, v.name, v.price, v.stock || 100);
        }
      }

      return productId;
    });

    const id = insertProduct();
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(params.id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const images = db
    .prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC')
    .all((product as { id: number }).id);
  const variants = db
    .prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC')
    .all((product as { id: number }).id);

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

    db.prepare(`
      UPDATE products SET
        name = ?, description = ?, price_min = ?, price_max = ?,
        brand = ?, category_id = ?, audience = ?,
        is_new_arrival = ?, is_featured = ?,
        free_delivery = ?, discount_label = ?, stock = ?, notes = ?
      WHERE id = ?
    `).run(
      name, description || null, price_min, price_max || null,
      brand || null, category_id || null, audienceValue,
      is_new_arrival ? 1 : 0,
      is_featured ? 1 : 0, free_delivery ? 1 : 0, discount_label || null,
      stock, notes || null, params.id
    );

    const updateRelated = db.transaction(() => {
      // Replace images
      if (images.length > 0) {
        db.prepare('DELETE FROM product_images WHERE product_id = ?').run(params.id);
        const insertImg = db.prepare(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)'
        );
        images.forEach((img: { url: string }, i: number) => {
          insertImg.run(params.id, img.url, i === 0 ? 1 : 0);
        });
      }

      // Replace variants
      db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(params.id);
      if (variants.length > 0) {
        const insertVariant = db.prepare(
          'INSERT INTO product_variants (product_id, name, price, stock) VALUES (?, ?, ?, ?)'
        );
        for (const v of variants) {
          insertVariant.run(params.id, v.name, v.price, v.stock || 100);
        }
      }
    });

    updateRelated();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  db.prepare('DELETE FROM products WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}

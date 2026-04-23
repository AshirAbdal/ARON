import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const audience = searchParams.get('audience');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'latest';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const featured = searchParams.get('featured');
  const newArrival = searchParams.get('new_arrival');

  const ALLOWED_AUDIENCE = ['men', 'women', 'baby', 'unisex'];
  const audienceFilter = audience && ALLOWED_AUDIENCE.includes(audience) ? audience : null;

  let query = `
    SELECT p.*, c.name as category_name, c.slug as category_slug,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (category) {
    query += ' AND c.slug = ?';
    params.push(category);
  }
  if (audienceFilter) {
    query += ' AND p.audience = ?';
    params.push(audienceFilter);
  }
  if (search) {
    query += ' AND (p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (featured === '1') {
    query += ' AND p.is_featured = 1';
  }
  if (newArrival === '1') {
    query += ' AND p.is_new_arrival = 1';
  }

  const sortMap: Record<string, string> = {
    latest: 'p.created_at DESC',
    oldest: 'p.created_at ASC',
    price_asc: 'p.price_min ASC',
    price_desc: 'p.price_min DESC',
    name_asc: 'p.name ASC',
  };
  query += ` ORDER BY ${sortMap[sort] || 'p.created_at DESC'}`;

  const countQuery = `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1${
    category ? ' AND c.slug = ?' : ''
  }${audienceFilter ? ' AND p.audience = ?' : ''}${
    search ? ' AND (p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)' : ''
  }${featured === '1' ? ' AND p.is_featured = 1' : ''}${
    newArrival === '1' ? ' AND p.is_new_arrival = 1' : ''
  }`;

  const total = (db.prepare(countQuery).get(...params) as { total: number }).total;

  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const products = db.prepare(query).all(...params);

  return NextResponse.json({ products, total, limit, offset });
}

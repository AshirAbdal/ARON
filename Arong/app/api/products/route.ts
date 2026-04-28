import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

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

  let countQuery = `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`;
  if (category) countQuery += ' AND c.slug = ?';
  if (audienceFilter) countQuery += ' AND p.audience = ?';
  if (search) countQuery += ' AND (p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)';
  if (featured === '1') countQuery += ' AND p.is_featured = 1';
  if (newArrival === '1') countQuery += ' AND p.is_new_arrival = 1';

  const [[countRows], [products]] = await Promise.all([
    pool.execute<RowDataPacket[]>(countQuery, params),
    pool.execute<RowDataPacket[]>(query + ' LIMIT ? OFFSET ?', [...params, limit, offset]),
  ]);

  return NextResponse.json({ products, total: (countRows[0] as { total: number }).total, limit, offset });
}

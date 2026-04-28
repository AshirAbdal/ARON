import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function GET() {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM categories ORDER BY name ASC');
  return NextResponse.json({ categories: rows });
}

export async function POST(req: NextRequest) {
  const { name, description, image_url } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
      [name, slug, description || null, image_url || null]
    );
    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
  }
}

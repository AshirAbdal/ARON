import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();

  try {
    const res = db.prepare(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)'
    ).run(name, slug, description || null);
    return NextResponse.json({ id: res.lastInsertRowid }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
  }
}

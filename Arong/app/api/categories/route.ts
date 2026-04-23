import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  return NextResponse.json({ categories });
}

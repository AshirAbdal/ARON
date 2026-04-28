import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { name, description, image_url } = await req.json();
  await pool.execute('UPDATE categories SET name = ?, description = ?, image_url = ? WHERE id = ?', [
    name, description || null, image_url || null, params.id,
  ]);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await pool.execute('DELETE FROM categories WHERE id = ?', [params.id]);
  return NextResponse.json({ success: true });
}

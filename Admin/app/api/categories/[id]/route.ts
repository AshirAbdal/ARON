import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { name, description } = await req.json();
  db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(
    name, description || null, params.id
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  db.prepare('DELETE FROM categories WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}

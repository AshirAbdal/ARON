import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (typeof body.message === 'string') {
      const m = body.message.trim();
      if (!m) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
      if (m.length > 200) {
        return NextResponse.json(
          { error: 'Message must be 200 characters or fewer' },
          { status: 400 }
        );
      }
      fields.push('message = ?');
      values.push(m);
    }
    if (body.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(body.is_active ? 1 : 0);
    }
    if (body.sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(Number(body.sort_order) || 0);
    }
    if (body.starts_at !== undefined) {
      fields.push('starts_at = ?');
      values.push(body.starts_at || null);
    }
    if (body.ends_at !== undefined) {
      fields.push('ends_at = ?');
      values.push(body.ends_at || null);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(params.id);
    await pool.execute(`UPDATE announcements SET ${fields.join(', ')} WHERE id = ?`, values);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await pool.execute('DELETE FROM announcements WHERE id = ?', [params.id]);
  return NextResponse.json({ success: true });
}

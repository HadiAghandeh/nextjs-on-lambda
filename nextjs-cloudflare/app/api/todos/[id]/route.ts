import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { env } = await getCloudflareContext();
    const { DB } = env;
    const { id } = await params;

    const result = await DB.prepare(
      'SELECT * FROM todos WHERE id = ?'
    ).bind(id).first();

    if (!result) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching todo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todo' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { env } = await getCloudflareContext();
    const { DB } = env;
    const { id } = await params;

    const body = await request.json() as {
      title?: string;
      description?: string;
      completed?: boolean;
    };
    const { title, description, completed } = body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: (string | boolean)[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (completed !== undefined) {
      updates.push('completed = ?');
      values.push(completed);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await DB.prepare(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = ? RETURNING *`
    ).bind(...values).first();

    if (!result) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { env } = await getCloudflareContext();
    const { DB } = env;
    const { id } = await params;

    const result = await DB.prepare(
      'DELETE FROM todos WHERE id = ? RETURNING *'
    ).bind(id).first();

    if (!result) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
}

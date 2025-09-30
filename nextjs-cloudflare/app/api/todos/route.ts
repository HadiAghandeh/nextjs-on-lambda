import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  try {
    const { env } = await getCloudflareContext();
    const { DB } = env;

    const { results } = await DB.prepare(
      'SELECT * FROM todos ORDER BY created_at DESC'
    ).all();

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    const { DB } = env;

    const body = await request.json() as { title?: string; description?: string };
    const { title, description } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await DB.prepare(
      'INSERT INTO todos (title, description) VALUES (?, ?) RETURNING *'
    ).bind(title, description || '').first();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}

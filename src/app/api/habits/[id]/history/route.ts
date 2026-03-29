import { NextRequest } from 'next/server';
import clientPromise, { getDbName } from '@/lib/mongodb';
import { getUserId, errorResponse, successResponse } from '@/lib/api-helpers';

const COLLECTION = 'habit_history';

// GET /api/habits/:id/history — fetch edit history for a habit
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;
    const userId = getUserId();
    const client = await clientPromise;
    const db = client.db(getDbName());

    const history = await db.collection(COLLECTION)
      .find({ habitId, userId })
      .sort({ timestamp: -1 })
      .toArray();

    const mapped = history.map(({ _id, userId: _u, ...rest }) => ({
      ...rest,
      id: rest.id || _id.toString(),
    }));

    return successResponse(mapped);
  } catch (error) {
    console.error('GET /api/habits/[id]/history error:', error);
    return errorResponse('Failed to fetch history', 500);
  }
}

// POST /api/habits/:id/history — record a history entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;
    const userId = getUserId();
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(getDbName());

    const now = new Date().toISOString();
    const entry = {
      id: body.id || generateId(),
      userId,
      habitId,
      changeType: body.changeType || 'edited',
      date: now.split('T')[0],
      timestamp: now,
      changes: body.changes || {},
      snapshot: body.snapshot || {},
    };

    await db.collection(COLLECTION).insertOne({ ...entry, _id: entry.id as any });

    return successResponse(entry, 201);
  } catch (error) {
    console.error('POST /api/habits/[id]/history error:', error);
    return errorResponse('Failed to record history', 500);
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

import { NextRequest } from 'next/server';
import clientPromise, { getDbName } from '@/lib/mongodb';
import { getUserId, errorResponse, successResponse, isValidDateKey } from '@/lib/api-helpers';

const COLLECTION = 'habit_logs';

// GET /api/habits/:id/logs — fetch logs for a habit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;
    const userId = getUserId();
    const client = await clientPromise;
    const db = client.db(getDbName());

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date'); // single date

    const filter: Record<string, unknown> = { habitId, userId };
    if (date) {
      filter.date = date;
    } else {
      if (startDate) filter.date = { ...((filter.date as object) || {}), $gte: startDate };
      if (endDate) filter.date = { ...((filter.date as object) || {}), $lte: endDate };
    }

    const logs = await db.collection(COLLECTION)
      .find(filter)
      .sort({ date: -1, time: -1 })
      .toArray();

    const mapped = logs.map(({ _id, userId: _u, ...rest }) => ({
      ...rest,
      id: rest.id || _id.toString(),
    }));

    return successResponse(mapped);
  } catch (error) {
    console.error('GET /api/habits/[id]/logs error:', error);
    return errorResponse('Failed to fetch logs', 500);
  }
}

// POST /api/habits/:id/logs — create or update a log for a specific date
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;
    const userId = getUserId();
    const body = await request.json();

    // Validate date
    const date = body.date;
    if (!date || !isValidDateKey(date)) {
      return errorResponse('date is required and must be in YYYY-MM-DD format');
    }

    const client = await clientPromise;
    const db = client.db(getDbName());

    // Verify habit exists
    const habit = await db.collection('habits').findOne({ id: habitId, userId });
    if (!habit) return errorResponse('Habit not found', 404);

    const now = new Date().toISOString();
    const logId = body.id || generateId();

    const log = {
      id: logId,
      userId,
      habitId,
      date,
      time: body.time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      duration: body.duration,
      note: body.note || '',
      moodBefore: body.moodBefore,
      moodAfter: body.moodAfter,
      reminderUsed: body.reminderUsed ?? false,
      perceivedDifficulty: body.perceivedDifficulty || habit.difficulty || 'medium',
      completed: body.completed ?? false,
      status: body.status || (body.completed ? 'completed' : 'pending'),
      value: body.value,
      source: body.source || 'manual',
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    // Upsert: if a log exists for this habit+date+status=completed, update it
    // Otherwise insert a new one
    if (body.upsert) {
      await db.collection(COLLECTION).updateOne(
        { habitId, userId, date },
        { $set: log },
        { upsert: true }
      );
    } else {
      await db.collection(COLLECTION).insertOne({ ...log, _id: logId as any });
    }

    return successResponse(log, 201);
  } catch (error) {
    console.error('POST /api/habits/[id]/logs error:', error);
    return errorResponse('Failed to create log', 500);
  }
}

// DELETE /api/habits/:id/logs?logId=xxx — delete a specific log
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;
    const userId = getUserId();
    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('logId');

    if (!logId) return errorResponse('logId query parameter is required');

    const client = await clientPromise;
    const db = client.db(getDbName());

    const result = await db.collection(COLLECTION).deleteOne({ id: logId, habitId, userId });
    if (result.deletedCount === 0) return errorResponse('Log not found', 404);

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('DELETE /api/habits/[id]/logs error:', error);
    return errorResponse('Failed to delete log', 500);
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

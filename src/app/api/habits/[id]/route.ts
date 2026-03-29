import { NextRequest } from 'next/server';
import clientPromise, { getDbName } from '@/lib/mongodb';
import { getUserId, errorResponse, successResponse } from '@/lib/api-helpers';

const COLLECTION = 'habits';

// GET /api/habits/:id — fetch a single habit
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserId();
    const client = await clientPromise;
    const db = client.db(getDbName());

    const habit = await db.collection(COLLECTION).findOne({ id, userId });
    if (!habit) return errorResponse('Habit not found', 404);

    const { _id, userId: _u, ...rest } = habit;
    return successResponse(rest);
  } catch (error) {
    console.error('GET /api/habits/[id] error:', error);
    return errorResponse('Failed to fetch habit', 500);
  }
}

// PATCH /api/habits/:id — update a habit
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserId();
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(getDbName());

    // Remove fields that shouldn't be updated directly
    delete body.id;
    delete body.userId;
    delete body.createdAt;

    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { id, userId },
      { $set: { ...body, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );

    if (!result) return errorResponse('Habit not found', 404);

    const { _id, userId: _u, ...rest } = result;
    return successResponse(rest);
  } catch (error) {
    console.error('PATCH /api/habits/[id] error:', error);
    return errorResponse('Failed to update habit', 500);
  }
}

// DELETE /api/habits/:id — delete a habit and its logs
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserId();
    const client = await clientPromise;
    const db = client.db(getDbName());

    const result = await db.collection(COLLECTION).deleteOne({ id, userId });
    if (result.deletedCount === 0) return errorResponse('Habit not found', 404);

    // Also delete related logs and timer sessions
    await db.collection('habit_logs').deleteMany({ habitId: id, userId });
    await db.collection('timer_sessions').deleteMany({ habitId: id, userId });

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('DELETE /api/habits/[id] error:', error);
    return errorResponse('Failed to delete habit', 500);
  }
}

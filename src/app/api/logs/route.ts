import { NextRequest } from 'next/server';
import clientPromise, { getDbName } from '@/lib/mongodb';
import { getUserId, errorResponse, successResponse } from '@/lib/api-helpers';

const COLLECTION = 'habit_logs';

// GET /api/logs — fetch all logs for the user (with optional date filters)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId();
    const client = await clientPromise;
    const db = client.db(getDbName());

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filter: Record<string, unknown> = { userId };
    if (startDate) filter.date = { ...((filter.date as object) || {}), $gte: startDate };
    if (endDate) filter.date = { ...((filter.date as object) || {}), $lte: endDate };

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
    console.error('GET /api/logs error:', error);
    return errorResponse('Failed to fetch logs', 500);
  }
}

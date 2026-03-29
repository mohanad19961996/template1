import { NextRequest, NextResponse } from 'next/server';
import clientPromise, { getDbName } from '@/lib/mongodb';

const USER_ID = 'default-user';

// POST /api/sync — push localStorage state to MongoDB (upsert all habits & logs)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(getDbName());

    const results = { habits: 0, logs: 0 };

    // Upsert habits
    if (Array.isArray(body.habits) && body.habits.length > 0) {
      const ops = body.habits.map((h: any) => ({
        updateOne: {
          filter: { id: h.id, userId: USER_ID },
          update: { $set: { ...h, userId: USER_ID } },
          upsert: true,
        },
      }));
      const res = await db.collection('habits').bulkWrite(ops);
      results.habits = res.upsertedCount + res.modifiedCount;
    }

    // Upsert habit logs
    if (Array.isArray(body.habitLogs) && body.habitLogs.length > 0) {
      const ops = body.habitLogs.map((l: any) => ({
        updateOne: {
          filter: { id: l.id, userId: USER_ID },
          update: { $set: { ...l, userId: USER_ID } },
          upsert: true,
        },
      }));
      const res = await db.collection('habit_logs').bulkWrite(ops);
      results.logs = res.upsertedCount + res.modifiedCount;
    }

    return NextResponse.json({ success: true, synced: results });
  } catch (error) {
    console.error('POST /api/sync error:', error);
    return NextResponse.json({ error: 'Sync failed', details: String(error) }, { status: 500 });
  }
}

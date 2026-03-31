import { NextRequest, NextResponse } from 'next/server';
import clientPromise, { getDbName } from '@/lib/mongodb';

const COLLECTION = 'active_timer';
const USER_ID = 'default-user';

/** GET — fetch current active timer */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(getDbName());
    const doc = await db.collection(COLLECTION).findOne({ userId: USER_ID });
    if (!doc) return NextResponse.json({ data: null });
    const { _id, userId, ...timer } = doc;
    return NextResponse.json({ data: timer });
  } catch (error) {
    console.error('Timer GET error:', error);
    return NextResponse.json({ error: 'Failed to load timer' }, { status: 500 });
  }
}

/** POST — create/start a new timer (replaces any existing) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(getDbName());
    await db.collection(COLLECTION).updateOne(
      { userId: USER_ID },
      { $set: { ...body, userId: USER_ID, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Timer POST error:', error);
    return NextResponse.json({ error: 'Failed to save timer' }, { status: 500 });
  }
}

/** PATCH — update timer state (pause/resume/complete/phase change) */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(getDbName());
    await db.collection(COLLECTION).updateOne(
      { userId: USER_ID },
      { $set: { ...body, updatedAt: new Date().toISOString() } }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Timer PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update timer' }, { status: 500 });
  }
}

/** DELETE — clear active timer (cancel/complete) */
export async function DELETE() {
  try {
    const client = await clientPromise;
    const db = client.db(getDbName());
    await db.collection(COLLECTION).deleteOne({ userId: USER_ID });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Timer DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete timer' }, { status: 500 });
  }
}

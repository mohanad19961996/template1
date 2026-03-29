import { NextRequest, NextResponse } from 'next/server';
import clientPromise, { getDbName } from '@/lib/mongodb';

const COLLECTION = 'app-state';
const DOC_ID = 'default-user';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(getDbName());
    const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID as any });

    if (!doc) {
      return NextResponse.json({ data: null });
    }

    const { _id, updatedAt, ...state } = doc;
    return NextResponse.json({ data: state });
  } catch (error) {
    console.error('MongoDB GET error:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(getDbName());

    await db.collection(COLLECTION).updateOne(
      { _id: DOC_ID as any },
      { $set: { ...body, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('MongoDB PUT error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import clientPromise, { getDbName } from '@/lib/mongodb';

const USER_ID = 'default-user';
const BLOB_COLLECTION = 'app-state';
const BLOB_DOC_ID = 'default-user';

// POST /api/migrate — migrate data from single-document blob to separate collections
// Safe to run multiple times — skips if collections already have data
export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db(getDbName());

    // Ensure history index + seed history for existing habits (idempotent)
    await db.collection('habit_history').createIndex({ habitId: 1, userId: 1, timestamp: -1 });
    await db.collection('habit_history').createIndex({ userId: 1, date: 1 });
    const existingHistoryCount = await db.collection('habit_history').countDocuments({ userId: USER_ID });
    if (existingHistoryCount === 0) {
      const allH = await db.collection('habits').find({ userId: USER_ID }).toArray();
      if (allH.length > 0) {
        const historyEntries = allH.map(h => ({
          _id: `hist_${h.id}_created` as any,
          id: `hist_${h.id}_created`,
          userId: USER_ID,
          habitId: h.id,
          changeType: 'created',
          date: (h.createdAt || new Date().toISOString()).split('T')[0],
          timestamp: h.createdAt || new Date().toISOString(),
          changes: {},
          snapshot: { nameEn: h.nameEn, nameAr: h.nameAr, category: h.category, color: h.color },
        }));
        await db.collection('habit_history').insertMany(historyEntries);
      }
    }

    // Check if already migrated
    const existingHabits = await db.collection('habits').countDocuments({ userId: USER_ID });
    if (existingHabits > 0) {
      return NextResponse.json({
        message: 'Already migrated',
        habits: existingHabits,
        historySeeded: existingHistoryCount === 0,
        skipped: true,
      });
    }

    // Read from blob
    const blob = await db.collection(BLOB_COLLECTION).findOne({ _id: BLOB_DOC_ID as any });
    if (!blob) {
      return NextResponse.json({ message: 'No blob data found to migrate', skipped: true });
    }

    const results = { habits: 0, habitLogs: 0, timerSessions: 0 };

    // Migrate habits
    if (blob.habits && Array.isArray(blob.habits) && blob.habits.length > 0) {
      const habitsToInsert = blob.habits.map((h: any) => ({
        ...h,
        _id: h.id,
        userId: USER_ID,
        trackingType: h.trackingType ?? (h.expectedDuration ? 'timer' : 'boolean'),
        targetValue: h.targetValue ?? (h.expectedDuration ? h.expectedDuration : 1),
        targetUnit: h.targetUnit ?? (h.expectedDuration ? 'minutes' : 'times'),
        scheduleType: h.scheduleType ?? (h.frequency === 'custom' ? 'custom' : h.frequency === 'weekly' ? 'weekly' : 'daily'),
        scheduleDays: h.scheduleDays ?? h.customDays ?? [],
        allowPartial: h.allowPartial ?? false,
        allowSkip: h.allowSkip ?? false,
      }));

      await db.collection('habits').insertMany(habitsToInsert);
      results.habits = habitsToInsert.length;
    }

    // Migrate habit logs
    if (blob.habitLogs && Array.isArray(blob.habitLogs) && blob.habitLogs.length > 0) {
      const logsToInsert = blob.habitLogs.map((l: any) => ({
        ...l,
        _id: l.id,
        userId: USER_ID,
        status: l.status ?? (l.completed ? 'completed' : 'missed'),
        source: l.source ?? 'manual',
      }));

      await db.collection('habit_logs').insertMany(logsToInsert);
      results.habitLogs = logsToInsert.length;
    }

    // Migrate timer sessions
    if (blob.timerSessions && Array.isArray(blob.timerSessions) && blob.timerSessions.length > 0) {
      const sessionsToInsert = blob.timerSessions.map((s: any) => ({
        ...s,
        _id: s.id,
        userId: USER_ID,
      }));

      await db.collection('timer_sessions').insertMany(sessionsToInsert);
      results.timerSessions = sessionsToInsert.length;
    }

    // Create indexes for fast queries
    await db.collection('habits').createIndex({ userId: 1, archived: 1 });
    await db.collection('habits').createIndex({ userId: 1, category: 1 });
    await db.collection('habit_logs').createIndex({ habitId: 1, userId: 1, date: 1 });
    await db.collection('habit_logs').createIndex({ userId: 1, date: 1 });
    await db.collection('timer_sessions').createIndex({ habitId: 1, userId: 1 });

    return NextResponse.json({
      message: 'Migration completed successfully',
      migrated: results,
      skipped: false,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed', details: String(error) }, { status: 500 });
  }
}

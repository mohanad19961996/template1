import { NextRequest } from 'next/server';
import clientPromise, { getDbName } from '@/lib/mongodb';
import { getUserId, errorResponse, successResponse, requireString } from '@/lib/api-helpers';

const COLLECTION = 'habits';

// GET /api/habits — fetch all habits for the user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId();
    const client = await clientPromise;
    const db = client.db(getDbName());

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active'); // 'true' | 'false' | null (all)
    const category = searchParams.get('category');

    const filter: Record<string, unknown> = { userId };
    if (active === 'true') filter.archived = false;
    if (active === 'false') filter.archived = true;
    if (category) filter.category = category;

    const habits = await db.collection(COLLECTION)
      .find(filter)
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    // Map _id to id for frontend compatibility
    const mapped = habits.map(({ _id, userId: _u, ...rest }) => ({
      ...rest,
      id: rest.id || _id.toString(),
    }));

    return successResponse(mapped);
  } catch (error) {
    console.error('GET /api/habits error:', error);
    return errorResponse('Failed to fetch habits', 500);
  }
}

// POST /api/habits — create a new habit
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId();
    const body = await request.json();

    // Validate required fields
    const titleError = requireString(body.nameEn || body.nameAr, 'name (nameEn or nameAr)');
    if (titleError && !body.nameAr) return errorResponse(titleError);

    const client = await clientPromise;
    const db = client.db(getDbName());

    // Get next order number
    const lastHabit = await db.collection(COLLECTION)
      .findOne({ userId }, { sort: { order: -1 } });
    const nextOrder = (lastHabit?.order ?? -1) + 1;

    const now = new Date().toISOString();
    const habit = {
      id: generateId(),
      userId,
      nameEn: body.nameEn || '',
      nameAr: body.nameAr || '',
      descriptionEn: body.descriptionEn || '',
      descriptionAr: body.descriptionAr || '',
      category: body.category || 'other',
      frequency: body.frequency || 'daily',
      customDays: body.customDays || [],
      priority: body.priority || 'medium',
      difficulty: body.difficulty || 'medium',
      color: body.color || '#3B82F6',
      icon: body.icon || 'Activity',
      type: body.type || 'positive',
      trackingType: body.trackingType || 'boolean',
      targetValue: body.targetValue ?? 1,
      targetUnit: body.targetUnit || 'times',
      scheduleType: body.scheduleType || 'daily',
      scheduleDays: body.scheduleDays || body.customDays || [],
      weeklyTarget: body.weeklyTarget,
      allowPartial: body.allowPartial ?? false,
      allowSkip: body.allowSkip ?? false,
      reminderEnabled: body.reminderEnabled ?? false,
      reminderTime: body.reminderTime,
      reminderDays: body.reminderDays,
      targetPerDay: body.targetPerDay,
      image: body.image,
      cueEn: body.cueEn, cueAr: body.cueAr,
      routineEn: body.routineEn, routineAr: body.routineAr,
      rewardEn: body.rewardEn, rewardAr: body.rewardAr,
      placeEn: body.placeEn, placeAr: body.placeAr,
      preferredTime: body.preferredTime,
      expectedDuration: body.expectedDuration,
      windowStart: body.windowStart,
      windowEnd: body.windowEnd,
      createdAt: now,
      archived: false,
      order: nextOrder,
    };

    await db.collection(COLLECTION).insertOne({ ...habit, _id: habit.id as any });

    return successResponse(habit, 201);
  } catch (error) {
    console.error('POST /api/habits error:', error);
    return errorResponse('Failed to create habit', 500);
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

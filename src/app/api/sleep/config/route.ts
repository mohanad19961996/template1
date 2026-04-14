import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserId, successResponse, errorResponse } from '@/lib/api-helpers';

const DEFAULT_CONFIG = {
  bedtime: '23:00',
  wake_time: '07:00',
  enabled: true,
  reminder_enabled: false,
  reminder_offset_minutes: 30,
};

const TIME_REGEX = /^\d{2}:\d{2}$/;

function isValidTime(value: string): boolean {
  if (!TIME_REGEX.test(value)) return false;
  const [h, m] = value.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

async function getOrCreateConfig(userId: string) {
  const { data, error } = await supabase
    .from('sleep_config')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (data) return data;

  // PGRST116 = no rows returned
  if (error && error.code === 'PGRST116') {
    const now = new Date().toISOString();
    const { data: created, error: createErr } = await supabase
      .from('sleep_config')
      .insert({
        user_id: userId,
        ...DEFAULT_CONFIG,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    if (createErr) throw createErr;
    return created;
  }

  throw error;
}

// GET /api/sleep/config
export async function GET() {
  try {
    const userId = getUserId();
    const config = await getOrCreateConfig(userId);
    return successResponse(config);
  } catch (error) {
    console.error('GET /api/sleep/config error:', error);
    return errorResponse('Failed to fetch sleep config', 500);
  }
}

// PATCH /api/sleep/config
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserId();
    const body = await request.json();
    const { bedtime, wake_time, enabled, reminder_enabled, reminder_offset_minutes } = body;

    // Validate time formats if provided
    if (bedtime !== undefined) {
      if (typeof bedtime !== 'string' || !isValidTime(bedtime)) {
        return errorResponse('bedtime must be a valid HH:mm time (00:00-23:59)');
      }
    }
    if (wake_time !== undefined) {
      if (typeof wake_time !== 'string' || !isValidTime(wake_time)) {
        return errorResponse('wake_time must be a valid HH:mm time (00:00-23:59)');
      }
    }
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return errorResponse('enabled must be a boolean');
    }
    if (reminder_enabled !== undefined && typeof reminder_enabled !== 'boolean') {
      return errorResponse('reminder_enabled must be a boolean');
    }
    if (reminder_offset_minutes !== undefined) {
      if (typeof reminder_offset_minutes !== 'number' || !Number.isInteger(reminder_offset_minutes) || reminder_offset_minutes < 0) {
        return errorResponse('reminder_offset_minutes must be a non-negative integer');
      }
    }

    // Fetch current config (creates default if needed)
    const config = await getOrCreateConfig(userId);

    // Determine if bedtime or wake_time is actually changing
    const isTimeChange =
      (bedtime !== undefined && bedtime !== config.bedtime) ||
      (wake_time !== undefined && wake_time !== config.wake_time);

    // Enforce once-per-7-calendar-days edit restriction (resets at midnight)
    if (isTimeChange && config.last_schedule_edit) {
      const editDate = new Date(config.last_schedule_edit);
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const editDayStart = new Date(editDate); editDayStart.setHours(0, 0, 0, 0);
      const daysPassed = Math.floor((todayStart.getTime() - editDayStart.getTime()) / 86400000);
      if (daysPassed < 7) {
        const daysLeft = 7 - daysPassed;
        const nextEditDate = new Date(editDayStart.getTime() + 7 * 86400000);
        const nextEditStr = nextEditDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        return errorResponse(
          `Sleep schedule can only be changed once every 7 days. Next edit: ${nextEditStr} (${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining).`,
          429,
        );
      }
    }

    // Build update object
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (bedtime !== undefined) updates.bedtime = bedtime;
    if (wake_time !== undefined) updates.wake_time = wake_time;
    if (enabled !== undefined) updates.enabled = enabled;
    if (reminder_enabled !== undefined) updates.reminder_enabled = reminder_enabled;
    if (reminder_offset_minutes !== undefined) updates.reminder_offset_minutes = reminder_offset_minutes;

    // Only stamp last_schedule_edit when bedtime/wake_time actually changes
    if (isTimeChange) {
      updates.last_schedule_edit = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('sleep_config')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return successResponse(data);
  } catch (error) {
    console.error('PATCH /api/sleep/config error:', error);
    if (error instanceof SyntaxError) return errorResponse('Invalid JSON body');
    return errorResponse('Failed to update sleep config', 500);
  }
}

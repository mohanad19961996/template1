import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserId, successResponse, errorResponse } from '@/lib/api-helpers';

/**
 * Calculate deviation in minutes between a scheduled HH:mm time and an actual TIMESTAMPTZ.
 * Positive = late, negative = early. Handles midnight crossing.
 *
 * We extract the local hours/minutes from the actual timestamp using the server's timezone.
 */
function calcDeviationMinutes(scheduledHHmm: string, actualISO: string): number {
  const [sH, sM] = scheduledHHmm.split(':').map(Number);
  const scheduledMin = sH * 60 + sM;

  // Extract local time from the actual timestamp using the server timezone
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const actual = new Date(actualISO);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(actual);

  const actualH = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
  const actualM = Number(parts.find(p => p.type === 'minute')?.value ?? 0);
  const actualMin = actualH * 60 + actualM;

  let diff = actualMin - scheduledMin;
  // Handle midnight crossing: wrap around if deviation exceeds half a day
  if (diff > 720) diff -= 1440;
  if (diff < -720) diff += 1440;

  return diff;
}

// GET /api/sleep/logs/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId();
    const { id } = await params;

    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return errorResponse('Sleep log not found', 404);
    }

    return successResponse(data);
  } catch (error) {
    console.error('GET /api/sleep/logs/[id] error:', error);
    return errorResponse('Failed to fetch sleep log', 500);
  }
}

// PATCH /api/sleep/logs/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId();
    const { id } = await params;
    const body = await request.json();

    // Fetch existing log
    const { data: existing, error: fetchErr } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !existing) {
      return errorResponse('Sleep log not found', 404);
    }

    // Validate whitelisted fields
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.wake_button_at !== undefined) {
      if (body.wake_button_at !== null) {
        const d = new Date(body.wake_button_at);
        if (isNaN(d.getTime())) {
          return errorResponse('wake_button_at must be a valid ISO timestamp');
        }
      }
      updates.wake_button_at = body.wake_button_at;
    }

    if (body.sleep_quality !== undefined) {
      if (body.sleep_quality !== null) {
        const q = Number(body.sleep_quality);
        if (!Number.isInteger(q) || q < 1 || q > 5) {
          return errorResponse('sleep_quality must be an integer between 1 and 5');
        }
        updates.sleep_quality = q;
      } else {
        updates.sleep_quality = null;
      }
    }

    if (body.mood_on_wake !== undefined) {
      if (body.mood_on_wake !== null) {
        const m = Number(body.mood_on_wake);
        if (!Number.isInteger(m) || m < 1 || m > 5) {
          return errorResponse('mood_on_wake must be an integer between 1 and 5');
        }
        updates.mood_on_wake = m;
      } else {
        updates.mood_on_wake = null;
      }
    }

    if (body.notes !== undefined) {
      if (body.notes !== null && typeof body.notes !== 'string') {
        return errorResponse('notes must be a string');
      }
      updates.notes = body.notes;
    }

    if (body.dream_note !== undefined) {
      if (body.dream_note !== null && typeof body.dream_note !== 'string') {
        return errorResponse('dream_note must be a string');
      }
      updates.dream_note = body.dream_note;
    }

    // Pause tracking fields
    if (body.paused_at !== undefined) {
      if (body.paused_at !== null) {
        const d = new Date(body.paused_at);
        if (isNaN(d.getTime())) {
          return errorResponse('paused_at must be a valid ISO timestamp');
        }
      }
      updates.paused_at = body.paused_at;
    }

    if (body.total_paused_seconds !== undefined) {
      const s = Number(body.total_paused_seconds);
      if (!Number.isInteger(s) || s < 0) {
        return errorResponse('total_paused_seconds must be a non-negative integer');
      }
      updates.total_paused_seconds = s;
    }

    if (body.pause_count !== undefined) {
      const c = Number(body.pause_count);
      if (!Number.isInteger(c) || c < 0) {
        return errorResponse('pause_count must be a non-negative integer');
      }
      updates.pause_count = c;
    }

    // Determine final timestamps for calculations
    const sleepAt: string | null = existing.sleep_button_at;
    const wakeAt: string | null = (updates.wake_button_at as string | undefined) ?? existing.wake_button_at;

    // When wake_button_at is being set and sleep_button_at exists, calculate derived fields
    if (sleepAt && wakeAt) {
      const totalMs = new Date(wakeAt).getTime() - new Date(sleepAt).getTime();
      const pausedSecs = (updates.total_paused_seconds as number | undefined) ?? existing.total_paused_seconds ?? 0;
      const sleepMs = totalMs - (pausedSecs * 1000);
      updates.sleep_duration_minutes = Math.round(Math.max(0, sleepMs) / 60000);

      // Bedtime deviation: compare sleep_button_at time to scheduled_bedtime
      if (existing.scheduled_bedtime) {
        updates.bedtime_deviation_minutes = calcDeviationMinutes(
          existing.scheduled_bedtime,
          sleepAt,
        );
      }

      // Wake deviation: compare wake_button_at time to scheduled_wake_time
      if (existing.scheduled_wake_time) {
        updates.wake_deviation_minutes = calcDeviationMinutes(
          existing.scheduled_wake_time,
          wakeAt,
        );
      }
    }

    const { data, error } = await supabase
      .from('sleep_logs')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return successResponse(data);
  } catch (error) {
    console.error('PATCH /api/sleep/logs/[id] error:', error);
    if (error instanceof SyntaxError) return errorResponse('Invalid JSON body');
    return errorResponse('Failed to update sleep log', 500);
  }
}

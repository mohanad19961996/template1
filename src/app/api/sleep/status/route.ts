import { supabase } from '@/lib/supabase';
import { getUserId, successResponse, errorResponse } from '@/lib/api-helpers';

// GET /api/sleep/status — current sleep state for lockdown UI
export async function GET() {
  try {
    const userId = getUserId();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 1. Fetch config
    const { data: config } = await supabase
      .from('sleep_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!config || !config.enabled) {
      return successResponse({ sleeping: false, enabled: false });
    }

    // 2. Check for active sleep log (has sleep_button_at but no wake_button_at)
    //    Look at today and yesterday to cover midnight crossing
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
    const yesterday = new Date(now.getTime() - 86400000);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: tz });

    const { data: activeLogs } = await supabase
      .from('sleep_logs')
      .select('id, sleep_button_at, date')
      .eq('user_id', userId)
      .in('date', [todayStr, yesterdayStr])
      .not('sleep_button_at', 'is', null)
      .is('wake_button_at', null)
      .order('date', { ascending: false })
      .limit(1);

    if (activeLogs && activeLogs.length > 0) {
      return successResponse({
        sleeping: true,
        sleepLog: {
          id: activeLogs[0].id,
          sleep_button_at: activeLogs[0].sleep_button_at,
          date: activeLogs[0].date,
        },
        config: {
          bedtime: config.bedtime,
          wake_time: config.wake_time,
        },
      });
    }

    // 3. Check if current time falls within the sleep window
    const inSleepWindow = isInSleepWindow(config.bedtime, config.wake_time, now, tz);

    return successResponse({
      sleeping: false,
      inSleepWindow,
      config: {
        bedtime: config.bedtime,
        wake_time: config.wake_time,
        enabled: config.enabled,
        reminder_enabled: config.reminder_enabled,
        reminder_offset_minutes: config.reminder_offset_minutes,
      },
    });
  } catch (error) {
    console.error('GET /api/sleep/status error:', error);
    return errorResponse('Failed to fetch sleep status', 500);
  }
}

/**
 * Check if `now` falls within [bedtime, wakeTime), handling midnight crossing.
 * Both bedtime and wakeTime are "HH:mm" strings. We compare using the user's tz.
 */
function isInSleepWindow(bedtime: string, wakeTime: string, now: Date, tz: string): boolean {
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);

  // Current time in the user's timezone
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const nowH = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
  const nowM = Number(parts.find(p => p.type === 'minute')?.value ?? 0);

  const nowMin = nowH * 60 + nowM;
  const bedMin = bH * 60 + bM;
  const wakeMin = wH * 60 + wM;

  if (bedMin <= wakeMin) {
    // No midnight crossing (e.g., 01:00 to 09:00)
    return nowMin >= bedMin && nowMin < wakeMin;
  }
  // Midnight crossing (e.g., 23:00 to 07:00)
  return nowMin >= bedMin || nowMin < wakeMin;
}

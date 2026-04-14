import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserId, successResponse, errorResponse } from '@/lib/api-helpers';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

function isValidDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

function isValidTime(value: string): boolean {
  if (!TIME_REGEX.test(value)) return false;
  const [h, m] = value.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function isValidISO(value: string): boolean {
  const d = new Date(value);
  return !isNaN(d.getTime());
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// GET /api/sleep/logs?last=N&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&year=YYYY
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId();
    const { searchParams } = new URL(request.url);
    const last = searchParams.get('last');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const year = searchParams.get('year');

    let query = supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Year filter: return all logs for that year
    if (year) {
      if (!/^\d{4}$/.test(year)) {
        return errorResponse('year must be YYYY format');
      }
      query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
    } else {
      if (startDate) {
        if (!isValidDate(startDate)) {
          return errorResponse('startDate must be YYYY-MM-DD format');
        }
        query = query.gte('date', startDate);
      }
      if (endDate) {
        if (!isValidDate(endDate)) {
          return errorResponse('endDate must be YYYY-MM-DD format');
        }
        query = query.lte('date', endDate);
      }
    }

    if (last) {
      const n = Number(last);
      if (!Number.isInteger(n) || n < 1 || n > 365) {
        return errorResponse('last must be an integer between 1 and 365');
      }
      query = query.limit(n);
    }

    const { data, error } = await query;
    if (error) throw error;

    return successResponse(data || []);
  } catch (error) {
    console.error('GET /api/sleep/logs error:', error);
    return errorResponse('Failed to fetch sleep logs', 500);
  }
}

// POST /api/sleep/logs
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId();
    const body = await request.json();
    const { date, scheduled_bedtime, scheduled_wake_time, sleep_button_at } = body;

    // Validate required fields
    if (!date || typeof date !== 'string') {
      return errorResponse('date is required');
    }
    if (!isValidDate(date)) {
      return errorResponse('date must be YYYY-MM-DD format');
    }

    if (!scheduled_bedtime || typeof scheduled_bedtime !== 'string') {
      return errorResponse('scheduled_bedtime is required');
    }
    if (!isValidTime(scheduled_bedtime)) {
      return errorResponse('scheduled_bedtime must be HH:mm format (00:00-23:59)');
    }

    if (!scheduled_wake_time || typeof scheduled_wake_time !== 'string') {
      return errorResponse('scheduled_wake_time is required');
    }
    if (!isValidTime(scheduled_wake_time)) {
      return errorResponse('scheduled_wake_time must be HH:mm format (00:00-23:59)');
    }

    if (sleep_button_at !== undefined && sleep_button_at !== null) {
      if (typeof sleep_button_at !== 'string' || !isValidISO(sleep_button_at)) {
        return errorResponse('sleep_button_at must be a valid ISO timestamp');
      }
    }

    // Check for existing active sleep session (has sleep_button_at but no wake_button_at)
    const { data: activeLogs, error: activeErr } = await supabase
      .from('sleep_logs')
      .select('id, date')
      .eq('user_id', userId)
      .not('sleep_button_at', 'is', null)
      .is('wake_button_at', null)
      .limit(1);

    if (activeErr) throw activeErr;

    if (activeLogs && activeLogs.length > 0) {
      return errorResponse('Already have an active sleep session', 409);
    }

    const now = new Date().toISOString();
    const id = generateId();

    const row = {
      id,
      user_id: userId,
      date,
      scheduled_bedtime,
      scheduled_wake_time,
      sleep_button_at: sleep_button_at || now,
      created_at: now,
      updated_at: now,
    };

    // Upsert on (user_id, date)
    const { data, error } = await supabase
      .from('sleep_logs')
      .upsert(row, { onConflict: 'user_id,date', ignoreDuplicates: false })
      .select()
      .single();

    if (error) throw error;
    return successResponse(data, 201);
  } catch (error) {
    console.error('POST /api/sleep/logs error:', error);
    if (error instanceof SyntaxError) return errorResponse('Invalid JSON body');
    return errorResponse('Failed to create sleep log', 500);
  }
}

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserId, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/logs — fetch all logs for the user (with optional date filters)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId);

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;

    const mapped = (data || []).map(row => ({ ...row.data, id: row.id }));
    return successResponse(mapped);
  } catch (error) {
    console.error('GET /api/logs error:', error);
    return errorResponse('Failed to fetch logs', 500);
  }
}

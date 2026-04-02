import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const USER_ID = 'default-user';

/** GET — fetch current active timer */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('active_timer')
      .select('data')
      .eq('user_id', USER_ID)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return NextResponse.json({ data: data?.data || null });
  } catch (error) {
    console.error('Timer GET error:', error);
    return NextResponse.json({ error: 'Failed to load timer' }, { status: 500 });
  }
}

/** POST — create/start a new timer (replaces any existing) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { error } = await supabase.from('active_timer').upsert({
      user_id: USER_ID,
      data: { ...body, updatedAt: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Timer POST error:', error);
    return NextResponse.json({ error: 'Failed to save timer' }, { status: 500 });
  }
}

/** PATCH — update timer state */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Fetch current timer data and merge
    const { data: existing } = await supabase
      .from('active_timer')
      .select('data')
      .eq('user_id', USER_ID)
      .single();

    const merged = { ...(existing?.data || {}), ...body, updatedAt: new Date().toISOString() };

    const { error } = await supabase
      .from('active_timer')
      .update({ data: merged, updated_at: new Date().toISOString() })
      .eq('user_id', USER_ID);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Timer PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update timer' }, { status: 500 });
  }
}

/** DELETE — clear active timer */
export async function DELETE() {
  try {
    const { error } = await supabase
      .from('active_timer')
      .delete()
      .eq('user_id', USER_ID);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Timer DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete timer' }, { status: 500 });
  }
}

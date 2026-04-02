import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const USER_ID = 'default-user';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('user_id', USER_ID)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return NextResponse.json({ data: data?.data || null });
  } catch (error) {
    console.error('State GET error:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { error } = await supabase.from('app_state').upsert({
      user_id: USER_ID,
      data: body,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('State PUT error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

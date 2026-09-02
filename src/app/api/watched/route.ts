import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// "Watched" here is the same `attendance_logs` table the iOS app logs
// attendances into -- one shared dataset. Unlike the old Prisma model,
// there's no unique(userId, operaId): logging the same opera twice (a
// second, different performance) is a real, valid case on iOS, so this
// route allows it too. A comment added via addComment() in useOperaStore
// re-POSTs the full entry including its `id`; that's the one case this
// route treats as an update rather than a new log.

function toWatchedOpera(row: Record<string, unknown>) {
  return {
    id: row.id,
    operaId: row.opera_id,
    userId: row.user_id,
    rating: row.overall_rating,
    date: row.attendance_date,
    venue: row.venue_name,
    cast: row.cast ?? [],
    comments: row.comments ?? [],
    title: row.opera_title,
    composer: row.composer,
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('attendance_date', { ascending: false });

  if (error) {
    console.error('Error fetching watched list:', error);
    return NextResponse.json({ error: 'Failed to fetch watched list' }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(toWatchedOpera));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, operaId, rating, date, venue, cast, comments, title, composer } = body;

    if (!operaId || rating === undefined || !date) {
      return NextResponse.json({ error: 'operaId, rating, and date are required' }, { status: 400 });
    }

    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const row = {
      user_id: userData.user.id,
      opera_id: operaId,
      opera_title: title || 'Unknown',
      composer: composer || 'Unknown',
      venue_name: venue || '',
      city: '',
      country: '',
      attendance_date: attendanceDate.toISOString(),
      overall_rating: parseInt(rating, 10),
      cast: cast ?? [],
      comments: comments ?? [],
    };

    const query = id
      ? supabase.from('attendance_logs').update(row).eq('id', id).eq('user_id', userData.user.id)
      : supabase.from('attendance_logs').insert(row);

    const { data, error } = await query.select().single();
    if (error) throw error;

    return NextResponse.json(toWatchedOpera(data), { status: 201 });
  } catch (error) {
    console.error('Error adding/updating watched item:', error);
    return NextResponse.json({ error: 'Failed to add/update watched item' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const operaId = searchParams.get('operaId');
    if (!operaId) {
      return NextResponse.json({ error: 'operaId is required in query parameters' }, { status: 400 });
    }

    const { error, count } = await supabase
      .from('attendance_logs')
      .delete({ count: 'exact' })
      .eq('user_id', userData.user.id)
      .eq('opera_id', operaId);

    if (error) throw error;
    if (!count) {
      return NextResponse.json({ error: 'Watched item not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Removed from watched list' }, { status: 200 });
  } catch (error) {
    console.error('Error removing from watched list:', error);
    return NextResponse.json({ error: 'Failed to remove from watched list' }, { status: 500 });
  }
}

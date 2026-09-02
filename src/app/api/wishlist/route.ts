import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Wishlist here is the same `user_lists` (type = 'wants_to_experience') /
// `list_items` pair the iOS app reads and writes -- one shared dataset,
// not a separate web-only table. Every new Supabase user gets this default
// list created automatically (see supabase/migrations/0001_init.sql).

async function getWishlistListId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('user_lists')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'wants_to_experience')
    .single();
  return data?.id ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const listId = await getWishlistListId(supabase, userData.user.id);
  if (!listId) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from('list_items')
    .select('*')
    .eq('list_id', listId)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((row) => ({
      id: row.id,
      operaId: row.opera_id,
      userId: userData.user.id,
      addedDate: row.added_at,
      title: row.opera_title,
      composer: row.composer,
    }))
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { operaId, title, composer } = await request.json();
    if (!operaId) {
      return NextResponse.json({ error: 'operaId is required' }, { status: 400 });
    }

    const listId = await getWishlistListId(supabase, userData.user.id);
    if (!listId) {
      return NextResponse.json({ error: 'Default wishlist not found for this user' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('list_items')
      .insert({
        list_id: listId,
        user_id: userData.user.id,
        opera_id: operaId,
        opera_title: title || 'Unknown',
        composer: composer || 'Unknown',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        id: data.id,
        operaId: data.opera_id,
        userId: userData.user.id,
        addedDate: data.added_at,
        title: data.opera_title,
        composer: data.composer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
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
      return NextResponse.json({ error: 'operaId is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('list_items')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('opera_id', operaId);

    if (error) throw error;

    return NextResponse.json({ message: 'Removed from wishlist' }, { status: 200 });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}

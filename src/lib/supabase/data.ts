// Data access against the Supabase project shared with the OperaApp iOS app.
//
// These queries used to live behind /api/wishlist and /api/watched. On a
// static build there is no server to host them -- and they never added any
// authorization of their own, since Row Level Security already restricts
// every row to its owner. So the browser runs them directly instead, which is
// the same thing the iOS app does.
//
// Shape note: "wishlist" is the user's `wants_to_experience` list (created
// automatically for every new user by the trigger in the shared migrations),
// and "watched" is `attendance_logs`.

import { getSupabase } from "@/lib/supabase/client";
import type { WatchedOpera, WishlistOpera } from "@/types";

async function requireUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) throw new Error("Not signed in");
  return data.user.id;
}

async function wishlistListId(userId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from("user_lists")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "wants_to_experience")
    .single();
  return data?.id ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWishlistOpera(row: any, userId: string): WishlistOpera {
  return {
    id: row.id,
    operaId: row.opera_id,
    userId,
    addedDate: row.added_at,
    title: row.opera_title,
    composer: row.composer,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWatchedOpera(row: any): WatchedOpera {
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

export async function fetchWishlist(): Promise<WishlistOpera[]> {
  const userId = await requireUserId();
  const listId = await wishlistListId(userId);
  if (!listId) return [];

  const { data, error } = await getSupabase()
    .from("list_items")
    .select("*")
    .eq("list_id", listId)
    .order("added_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => toWishlistOpera(row, userId));
}

export async function addToWishlist(
  operaId: string,
  title?: string,
  composer?: string
): Promise<WishlistOpera> {
  const userId = await requireUserId();
  const listId = await wishlistListId(userId);
  if (!listId) throw new Error("No default wishlist for this user");

  const { data, error } = await getSupabase()
    .from("list_items")
    .insert({
      list_id: listId,
      user_id: userId,
      opera_id: operaId,
      opera_title: title || "Unknown",
      composer: composer || "Unknown",
    })
    .select()
    .single();

  if (error) throw error;
  return toWishlistOpera(data, userId);
}

export async function removeFromWishlist(operaId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await getSupabase()
    .from("list_items")
    .delete()
    .eq("user_id", userId)
    .eq("opera_id", operaId);
  if (error) throw error;
}

export async function fetchWatched(): Promise<WatchedOpera[]> {
  const userId = await requireUserId();
  const { data, error } = await getSupabase()
    .from("attendance_logs")
    .select("*")
    .eq("user_id", userId)
    .order("attendance_date", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toWatchedOpera);
}

/**
 * Saves a watched entry. Without an `id` this logs a new attendance -- the
 * same opera can be logged more than once, because seeing a second
 * production of it is a real thing to record. With an `id` it edits that
 * entry in place, which is how adding a comment to an existing log works.
 */
export async function saveWatched(entry: WatchedOpera): Promise<WatchedOpera> {
  const userId = await requireUserId();

  const attendanceDate = new Date(entry.date);
  if (isNaN(attendanceDate.getTime())) throw new Error("Invalid date");

  const row = {
    user_id: userId,
    opera_id: entry.operaId,
    opera_title: entry.title || "Unknown",
    composer: entry.composer || "Unknown",
    venue_name: entry.venue || "",
    city: "",
    country: "",
    attendance_date: attendanceDate.toISOString(),
    overall_rating: entry.rating,
    cast: entry.cast ?? [],
    comments: entry.comments ?? [],
  };

  const supabase = getSupabase();
  const query = entry.id
    ? supabase.from("attendance_logs").update(row).eq("id", entry.id).eq("user_id", userId)
    : supabase.from("attendance_logs").insert(row);

  const { data, error } = await query.select().single();
  if (error) throw error;
  return toWatchedOpera(data);
}

export async function removeFromWatched(operaId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await getSupabase()
    .from("attendance_logs")
    .delete()
    .eq("user_id", userId)
    .eq("opera_id", operaId);
  if (error) throw error;
}

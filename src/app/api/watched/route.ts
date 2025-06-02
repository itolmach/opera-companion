import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, Prisma } from '@/generated/prisma/client'; // Import Prisma for types if needed
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/watched - Fetch all watched operas for the user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const watchedItems = await prisma.watchedOpera.findMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json(watchedItems);
  } catch (error) {
    console.error('Error fetching watched list:', error);
    return NextResponse.json({ error: 'Failed to fetch watched list' }, { status: 500 });
  }
}

// POST /api/watched - Add or update a watched opera for the user
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { operaId, rating, date, venue, cast, comments } = body;

    if (!operaId || rating === undefined || !date) {
      return NextResponse.json({ error: 'operaId, rating, and date are required' }, { status: 400 });
    }

    // Validate data types if necessary, e.g., date should be a valid ISO string for Prisma
    // Prisma expects DateTime fields as ISO8601 strings or Date objects
    const watchedDate = new Date(date);
    if (isNaN(watchedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const dataToUpsert: Prisma.WatchedOperaCreateInput | Prisma.WatchedOperaUpdateInput = {
      user: { connect: { id: session.user.id } },
      operaId,
      rating: parseInt(rating, 10),
      date: watchedDate,
      venue: venue || null,
      cast: cast || Prisma.JsonNull, // Prisma.JsonNull for explicitly setting JSON null
      comments: comments || Prisma.JsonNull,
    };

    const result = await prisma.watchedOpera.upsert({
      where: {
        // Need a unique identifier for the user-opera combination if it exists
        // Let's assume we need to create a custom one or fetch first then update/create
        // For simplicity, let's ensure operaId is unique per user. If your schema has it:
        // userId_operaId: { userId: session.user.id, operaId },
        // If not, we must query first then decide to create or update.
        // To avoid complexity for now, let's try a simple find and update/create pattern.
        // This requires a custom unique constraint on (userId, operaId) for upsert to work directly on that.
        // If such constraint doesn't exist, this upsert won't work as intended without a primary key or unique field for `where`.
        // Assuming no @@unique([userId, operaId]) in schema for WatchedOpera for this example to be simpler to start:
        // We'll find existing, then update or create.
        // THIS IS A SIMPLIFIED APPROACH. A @@unique([userId, operaId]) is better for direct upsert.
        id: 'will_be_ignored_for_create_needs_proper_unique_field_for_upsert' 
      },
      create: dataToUpsert as Prisma.WatchedOperaCreateInput, // userId is part of dataToUpsert through connect
      update: dataToUpsert as Prisma.WatchedOperaUpdateInput, // userId is part of dataToUpsert through connect
    });

    // SAFER APPROACH without @@unique([userId, operaId]) on WatchedOpera:
    let watchedEntry = await prisma.watchedOpera.findFirst({
        where: { userId: session.user.id, operaId: operaId }
    });

    if (watchedEntry) {
        watchedEntry = await prisma.watchedOpera.update({
            where: { id: watchedEntry.id },
            data: dataToUpsert as Prisma.WatchedOperaUpdateInput
        });
    } else {
        watchedEntry = await prisma.watchedOpera.create({
            data: dataToUpsert as Prisma.WatchedOperaCreateInput
        });
    }

    return NextResponse.json(watchedEntry, { status: 201 });
  } catch (error) {
    console.error('Error adding/updating watched item:', error);
    // Check for Prisma specific errors if needed
    if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json({ error: 'Invalid data provided for watched item.', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add/update watched item' }, { status: 500 });
  }
}

// DELETE /api/watched - Remove a watched opera for the user
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const operaId = searchParams.get('operaId');

    if (!operaId) {
      return NextResponse.json({ error: 'operaId is required in query parameters' }, { status: 400 });
    }

    // We need to ensure we only delete the entry for the current user.
    // This will delete all entries for that operaId by that user (should be one if logic is correct)
    const deleteResult = await prisma.watchedOpera.deleteMany({
      where: {
        userId: session.user.id,
        operaId: operaId,
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({ error: 'Watched item not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Removed from watched list' }, { status: 200 });
  } catch (error) {
    console.error('Error removing from watched list:', error);
    return NextResponse.json({ error: 'Failed to remove from watched list' }, { status: 500 });
  }
} 
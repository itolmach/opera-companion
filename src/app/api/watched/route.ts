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

    const dataForOperation: Prisma.WatchedOperaCreateInput | Prisma.WatchedOperaUpdateInput = {
      user: { connect: { id: session.user.id } },
      operaId,
      rating: parseInt(rating, 10),
      date: watchedDate,
      venue: venue || null,
      cast: cast || Prisma.JsonNull, // Prisma.JsonNull for explicitly setting JSON null
      comments: comments || Prisma.JsonNull,
    };

    // SAFER APPROACH without @@unique([userId, operaId]) on WatchedOpera:
    let watchedEntry = await prisma.watchedOpera.findFirst({
        where: { userId: session.user.id, operaId: operaId }
    });

    if (watchedEntry) {
        watchedEntry = await prisma.watchedOpera.update({
            where: { id: watchedEntry.id },
            data: dataForOperation as Prisma.WatchedOperaUpdateInput
        });
    } else {
        watchedEntry = await prisma.watchedOpera.create({
            data: dataForOperation as Prisma.WatchedOperaCreateInput
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
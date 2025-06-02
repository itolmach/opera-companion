import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@/generated/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path if authOptions is exported differently or from a central lib

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const wishlistItems = await prisma.wishlistOpera.findMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json(wishlistItems);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { operaId } = await request.json();
    if (!operaId) {
      return NextResponse.json({ error: 'operaId is required' }, { status: 400 });
    }

    const newWishlistItem = await prisma.wishlistOpera.create({
      data: {
        userId: session.user.id,
        operaId: operaId as string, // Ensure operaId is treated as string if that's its type
        addedDate: new Date(),
      },
    });
    return NextResponse.json(newWishlistItem, { status: 201 });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const operaId = searchParams.get('operaId');

    if (!operaId) {
      return NextResponse.json({ error: 'operaId is required' }, { status: 400 });
    }

    await prisma.wishlistOpera.deleteMany({
      where: {
        userId: session.user.id,
        operaId: operaId as string,
      },
    });
    return NextResponse.json({ message: 'Removed from wishlist' }, { status: 200 });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
} 
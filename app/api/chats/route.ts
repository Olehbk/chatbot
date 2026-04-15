import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json([]);

  const chats = await prisma.chat.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, updatedAt: true },
  });
  return Response.json(chats);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { title } = await req.json();
  const chat = await prisma.chat.create({
    data: {
      title: title?.trim() || 'New Chat',
      userId: session.user.id,
    },
    select: { id: true, title: true, updatedAt: true },
  });
  return Response.json(chat);
}

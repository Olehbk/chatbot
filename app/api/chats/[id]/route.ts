import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = await params;
  const chat = await prisma.chat.findUnique({
    where: { id, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!chat) {
    return new Response(JSON.stringify({ error: 'Chat not found' }), { status: 404 });
  }
  return Response.json(chat);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = await params;
  const { messages, title } = await req.json();

  await prisma.message.deleteMany({ where: { chatId: id } });

  const chat = await prisma.chat.update({
    where: { id, userId: session.user.id },
    data: {
      ...(title && { title }),
      messages: {
        create: (messages as { role: string; content: string }[]).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      },
    },
    select: { id: true, title: true, updatedAt: true },
  });

  return Response.json(chat);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = await params;
  await prisma.chat.delete({ where: { id, userId: session.user.id } });
  return new Response(null, { status: 204 });
}

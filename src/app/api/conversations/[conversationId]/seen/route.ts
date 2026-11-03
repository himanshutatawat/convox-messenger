import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "../../../../libs/prismadb";
import { pusherServer } from "../../../../libs/pusherServer";
import { pusherEvents } from "../../../../libs/pusher";

interface IParams {
  conversationId?: string;
}

export async function POST(request: Request, { params }: { params: IParams }) {
  try {
    const session = await getServerSession(authOptions);
    const { conversationId } = params;

    if (!session?.user?.email || !conversationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify conversation existence and membership
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userIds: true },
    });

    if (!conversation) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    // Fast indexed query: Fetch only the single latest message using @@index([conversationId, createdAt])
    const lastMessage = await prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        seenIds: true,
        senderId: true,
      },
    });

    if (!lastMessage) {
      return NextResponse.json({ id: conversationId });
    }

    // If current user has already seen this message, skip redundant DB write and Pusher broadcasts
    if (lastMessage.seenIds.includes(currentUser.id)) {
      return NextResponse.json({ id: lastMessage.id, seen: true });
    }

    // Update only the last message
    const updatedMessage = await prisma.message.update({
      where: { id: lastMessage.id },
      data: {
        seen: { connect: { id: currentUser.id } },
      },
      include: {
        sender: true,
        seen: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
      },
    });

    // Notify user's sidebar
    await pusherServer.trigger(session.user.email, "conversation:update", {
      id: conversationId,
      messages: [updatedMessage],
    });

    // Broadcast seen update to active conversation participants
    await pusherServer.trigger(
      conversationId,
      pusherEvents.UPDATE_MESSAGE,
      updatedMessage
    );

    return NextResponse.json(updatedMessage);
  } catch (error: any) {
    console.error(error, "ERROR_MESSAGES_SEEN");
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { include: { seen: true } },
        users: true,
      },
    });

    if (!conversation) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return NextResponse.json(conversation);

    const updatedMessage = await prisma.message.update({
      where: { id: lastMessage.id },
      include: { sender: true, seen: true },
      data: {
        seen: { connect: { id: currentUser.id } },
      },
    });

    await pusherServer.trigger(session.user.email, "conversation:update", {
      id: conversationId,
      messages: [updatedMessage],
    });

    if (lastMessage.seenIds.indexOf(currentUser.id) !== -1) {
      return NextResponse.json(conversation);
    }

    await pusherServer.trigger(
      conversationId!,
      pusherEvents.UPDATE_MESSAGE,
      updatedMessage
    );

    return NextResponse.json(updatedMessage);
  } catch (error: any) {
    console.log(error, "ERROR_MESSAGES_SEEN");
    return new NextResponse("Internal Error", { status: 500 });
  }
}


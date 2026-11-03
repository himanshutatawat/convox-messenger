import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "../../../../libs/prismadb";
import { pusherServer } from "../../../../libs/pusherServer";
import { pusherEvents } from "../../../../libs/pusher";

interface IParams {
  messageId?: string;
}

export async function POST(request: Request, { params }: { params: IParams }) {
  try {
    const session = await getServerSession(authOptions);
    const { messageId } = params;

    if (!session?.user?.email || !messageId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isPinned: !existingMessage.isPinned,
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

    await pusherServer.trigger(
      existingMessage.conversationId,
      pusherEvents.UPDATE_MESSAGE,
      updatedMessage
    );

    return NextResponse.json(updatedMessage);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "../../../../libs/prismadb";
import { pusherServer } from "../../../../libs/pusherServer";
import { pusherEvents } from "../../../../libs/pusher";
import { MessageReaction } from "../../../../types";

interface IParams {
  messageId?: string;
}

export async function POST(request: Request, { params }: { params: IParams }) {
  try {
    const session = await getServerSession(authOptions);
    const { messageId } = params;
    const body = await request.json();
    const { emoji } = body;

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!messageId || !emoji) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
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

    if (!message) {
      return new NextResponse("Message not found", { status: 404 });
    }

    let reactions: MessageReaction[] = Array.isArray(message.reactions)
      ? (message.reactions as unknown as MessageReaction[])
      : [];

    const existingReactionIndex = reactions.findIndex((r) => r.emoji === emoji);

    if (existingReactionIndex > -1) {
      const reaction = reactions[existingReactionIndex];
      const userIndex = reaction.userIds.indexOf(currentUser.id);

      if (userIndex > -1) {
        // Toggle OFF
        reaction.userIds.splice(userIndex, 1);
        if (reaction.userNames) {
          reaction.userNames.splice(userIndex, 1);
        }

        if (reaction.userIds.length === 0) {
          reactions.splice(existingReactionIndex, 1);
        }
      } else {
        // Add user to existing emoji reaction
        reaction.userIds.push(currentUser.id);
        if (!reaction.userNames) reaction.userNames = [];
        reaction.userNames.push(currentUser.name || "User");
      }
    } else {
      // New emoji reaction
      reactions.push({
        emoji,
        userIds: [currentUser.id],
        userNames: [currentUser.name || "User"],
      });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        reactions: reactions as any,
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

    // Broadcast updated message with reactions in real time
    await pusherServer.trigger(
      message.conversationId,
      pusherEvents.UPDATE_MESSAGE,
      updatedMessage
    );

    return NextResponse.json(updatedMessage);
  } catch (error: any) {
    console.error(error, "ERROR_REACTION");
    return new NextResponse("Internal Error", { status: 500 });
  }
}


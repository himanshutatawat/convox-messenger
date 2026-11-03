import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "../../libs/prismadb";
import { pusherServer } from "../../libs/pusherServer";
import { pusherEvents } from "../../libs/pusher";
import { scrapeOG } from "../../libs/scrapeOG";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { message, image, audio, replyToId, conversationId, tempId } = body;

    if (!session?.user?.email || !conversationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true, image: true },
    });

    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Scrape OpenGraph preview if message contains a link
    let ogData = null;
    if (message && typeof message === "string") {
      ogData = await scrapeOG(message);
    }

    const messageData: any = {
      body: message,
      image: image,
      audio: audio,
      ogData: ogData || undefined,
      conversation: { connect: { id: conversationId } },
      sender: { connect: { id: currentUser.id } },
      seen: { connect: { id: currentUser.id } },
    };

    if (replyToId) {
      messageData.replyTo = { connect: { id: replyToId } };
    }

    const newMessage = await prisma.message.create({
      data: messageData,
      include: {
        seen: true,
        sender: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
      },
    });

    // Update conversation metadata with minimal select (never load all messages into memory)
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        messages: { connect: { id: newMessage.id } },
      },
      select: {
        users: {
          select: {
            email: true,
          },
        },
      },
    });

    const payloadWithTempId = {
      ...newMessage,
      tempId,
    };

    // Broadcast new message to active conversation room
    await pusherServer.trigger(conversationId, pusherEvents.NEW_MESSAGE, payloadWithTempId);

    // Notify sidebar of all conversation participants
    updatedConversation.users.forEach((user) => {
      if (user.email) {
        pusherServer.trigger(user.email, pusherEvents.UPDATE_CONVERSATION, {
          id: conversationId,
          messages: [newMessage],
        });
      }
    });

    return NextResponse.json(payloadWithTempId);
  } catch (error: any) {
    console.error(error, "ERROR_MESSAGES");
    return new NextResponse("Internal Error", { status: 500 });
  }
}

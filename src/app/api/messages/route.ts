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
    const { message, image, audio, replyToId, conversationId } = body;

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
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

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        messages: { connect: { id: newMessage.id } },
      },
      include: { users: true, messages: { include: { seen: true } } },
    });

    await pusherServer.trigger(conversationId, pusherEvents.NEW_MESSAGE, newMessage);

    const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];
    updatedConversation.users.map((user) => {
      pusherServer.trigger(user.email!, pusherEvents.UPDATE_CONVERSATION, {
        id: conversationId,
        messages: [lastMessage],
      });
    });

    return NextResponse.json(newMessage);
  } catch (error: any) {
    console.log(error, "ERROR_MESSAGES");
    return new NextResponse("Internal Error", { status: 500 });
  }
}

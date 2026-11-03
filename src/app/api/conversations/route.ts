import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "../../libs/prismadb";
import { pusherServer } from "../../libs/pusherServer";
import { pusherEvents } from "../../libs/pusher";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { userId, isGroup, members, name } = body;

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (isGroup && (!members || members.length < 2 || !name)) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    if (isGroup) {
      const newConversation = await prisma.conversation.create({
        data: {
          name,
          isGroup,
          users: {
            connect: [
              ...members.map((member: { value: string }) => ({ id: member.value })),
              { id: currentUser.id },
            ],
          },
        },
        include: { users: true },
      });

      newConversation.users.forEach((user) => {
        if (user.email) {
          pusherServer.trigger(user.email, pusherEvents.NEW_CONVERSATION, newConversation);
        }
      });

      return NextResponse.json(newConversation);
    }

    // Check for existing one-to-one conversation
    const existingConversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userIds: { equals: [currentUser.id, userId] } },
          { userIds: { equals: [userId, currentUser.id] } },
        ],
      },
    });

    const singleConversation = existingConversations[0];
    if (singleConversation) {
      return NextResponse.json(singleConversation);
    }

    const newConversation = await prisma.conversation.create({
      data: {
        users: {
          connect: [{ id: currentUser.id }, { id: userId }],
        },
      },
      include: { users: true },
    });

    newConversation.users.forEach((user) => {
      if (user.email) {
        pusherServer.trigger(user.email, pusherEvents.NEW_CONVERSATION, newConversation);
      }
    });

    return NextResponse.json(newConversation);
  } catch (error: any) {
    console.log(error, "CONVERSATION_ERROR");
    return new NextResponse("Internal Error", { status: 500 });
  }
}


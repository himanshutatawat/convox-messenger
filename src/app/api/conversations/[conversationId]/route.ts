import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../libs/prismadb";
import { pusherServer } from "../../../libs/pusherServer";
import { pusherEvents } from "../../../libs/pusher";

interface IParams {
  conversationId?: string;
}

export async function DELETE(request: Request, { params }: { params: IParams }) {
  try {
    const { conversationId } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const existingConversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { users: true },
    });

    if (!existingConversation) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    const deletedConversation = await prisma.conversation.deleteMany({
      where: {
        id: conversationId,
        userIds: { hasSome: [session.user.email] },
      },
    });

    existingConversation.users.forEach((user) => {
      if (user.email) {
        pusherServer.trigger(
          user.email,
          pusherEvents.DELETE_CONVERSATION,
          existingConversation
        );
      }
    });

    return NextResponse.json(deletedConversation);
  } catch (error: any) {
    console.log(error, "ERROR_CONVERSATION_DELETE");
    return new NextResponse("Internal Error", { status: 500 });
  }
}


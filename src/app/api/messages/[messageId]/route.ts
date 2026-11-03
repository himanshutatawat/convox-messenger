import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../libs/prismadb";
import { pusherServer } from "../../../libs/pusherServer";
import { pusherEvents } from "../../../libs/pusher";

interface IParams {
  messageId?: string;
}

export async function PATCH(request: Request, { params }: { params: IParams }) {
  try {
    const session = await getServerSession(authOptions);
    const { messageId } = params;
    const body = await request.json();
    const { message: newBody } = body;

    if (!session?.user?.email || !messageId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage || existingMessage.senderId !== currentUser.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        body: newBody,
        editedAt: new Date(),
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

export async function DELETE(request: Request, { params }: { params: IParams }) {
  try {
    const session = await getServerSession(authOptions);
    const { messageId } = params;

    if (!session?.user?.email || !messageId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage || existingMessage.senderId !== currentUser.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const unsentMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        body: "This message was unsent",
        image: null,
        audio: null,
        ogData: undefined,
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
      unsentMessage
    );

    return NextResponse.json(unsentMessage);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}


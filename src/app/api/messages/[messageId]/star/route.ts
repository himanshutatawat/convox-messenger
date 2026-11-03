import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "../../../../libs/prismadb";

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

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return new NextResponse("Not Found", { status: 404 });
    }

    let starredByIds = message.starredByIds || [];
    const index = starredByIds.indexOf(currentUser.id);

    if (index > -1) {
      starredByIds.splice(index, 1);
    } else {
      starredByIds.push(currentUser.id);
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        starredByIds,
      },
      include: {
        sender: true,
        seen: true,
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}


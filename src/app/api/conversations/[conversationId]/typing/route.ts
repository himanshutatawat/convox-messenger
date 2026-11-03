import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "../../../../libs/prismadb";
import { pusherServer } from "../../../../libs/pusherServer";

interface IParams {
  conversationId?: string;
}

export async function POST(request: Request, { params }: { params: IParams }) {
  try {
    const session = await getServerSession(authOptions);
    const { conversationId } = params;
    const body = await request.json();
    const { isTyping } = body;

    if (!session?.user?.email || !conversationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await pusherServer.trigger(conversationId, "typing", {
      userId: currentUser.id,
      userName: currentUser.name || "Someone",
      isTyping: !!isTyping,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}


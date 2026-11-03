import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import getMessages from "../../../../actions/getMessages";

interface IParams {
  conversationId?: string;
}

export async function GET(request: Request, { params }: { params: IParams }) {
  try {
    const session = await getServerSession(authOptions);
    const { conversationId } = params;

    if (!session?.user?.email || !conversationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const messages = await getMessages(conversationId, cursor, limit);

    return NextResponse.json(messages);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}


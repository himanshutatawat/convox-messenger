import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "../../libs/prismadb";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { name, image } = body;

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { name, image },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.log(error, "ERROR_SETTINGS");
    return new NextResponse("Internal Error", { status: 500 });
  }
}


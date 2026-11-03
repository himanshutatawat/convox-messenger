import prisma from "../libs/prismadb";

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  createdAt: true,
  updatedAt: true,
};

const getMessages = async (
  conversationId: string,
  cursor?: string,
  limit: number = 30
) => {
  try {
    const queryOptions: any = {
      where: {
        conversationId: conversationId,
      },
      include: {
        sender: {
          select: userSelect,
        },
        seen: {
          select: userSelect,
        },
        replyTo: {
          include: {
            sender: {
              select: userSelect,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    };

    if (cursor) {
      queryOptions.cursor = {
        id: cursor,
      };
      queryOptions.skip = 1;
    }

    const messages = await prisma.message.findMany(queryOptions);

    // Return in chronological order (oldest to newest)
    return messages.reverse() as any;
  } catch (error: any) {
    return [];
  }
};

export default getMessages;

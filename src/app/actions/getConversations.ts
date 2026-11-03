import prisma from "../libs/prismadb";
import getCurrentUser from "./getCurrentUser";

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  createdAt: true,
  updatedAt: true,
};

const getConversations = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) {
    return [];
  }

  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: {
        lastMessageAt: "desc",
      },
      where: {
        userIds: {
          has: currentUser.id,
        },
      },
      include: {
        users: {
          select: userSelect,
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            sender: {
              select: userSelect,
            },
            seen: {
              select: userSelect,
            },
          },
        },
      },
    });

    return conversations as any;
  } catch (error: any) {
    return [];
  }
};

export default getConversations;

import { Conversation, Message, User } from "@prisma/client";

export interface OGData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url?: string;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
  userNames?: string[];
}

export type FullMessageType = Message & {
  sender: User;
  seen: User[];
  replyTo?: (Message & { sender: User }) | null;
};

export type FullConversationType = Conversation & {
  users: User[];
  messages: FullMessageType[];
};

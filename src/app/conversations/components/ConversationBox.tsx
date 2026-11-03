"use client";

import clsx from "clsx";
import { useCallback, useMemo } from "react";

import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import Avatar from "../../components/Avatar";
import AvatarGroup from "../../components/AvatarGroup";
import useOtherUser from "../../hooks/useOtherUser";
import { FullConversationType } from "../../types";

interface ConversationBoxProps {
  data: FullConversationType;
  selected?: boolean;
}

const ConversationBox: React.FC<ConversationBoxProps> = ({ data, selected }) => {
  const otherUser = useOtherUser(data);
  const session = useSession();
  const router = useRouter();

  const handleClick = useCallback(() => {
    router.push(`/conversations/${data.id}`);
  }, [data, router]);

  const lastMessage = useMemo(() => {
    const messages = data.messages || [];

    return messages[messages.length - 1];
  }, [data.messages]);

  const userEmail = useMemo(() => session.data?.user?.email, [session.data?.user?.email]);

  const hasSeen = useMemo(() => {
    if (!lastMessage) {
      return false;
    }

    const seenArray = lastMessage.seen || [];

    if (!userEmail) {
      return false;
    }

    return seenArray.filter((user) => user.email === userEmail).length !== 0;
  }, [userEmail, lastMessage]);

  const lastMessageText = useMemo(() => {
    if (lastMessage?.image) {
      return "📷 Sent an image";
    }

    if (lastMessage?.body) {
      return lastMessage?.body;
    }

    return "Started a conversation";
  }, [lastMessage]);

  return (
    <div
      onClick={handleClick}
      className={clsx(
        `
        w-full 
        relative 
        flex 
        items-center 
        space-x-3 
        p-3 
        rounded-2xl
        transition-all
        duration-150
        cursor-pointer
        `,
        selected
          ? "bg-sky-50/90 dark:bg-slate-800 shadow-sm border border-sky-100 dark:border-slate-700/60"
          : "hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
      )}
    >
      {data.isGroup ? <AvatarGroup users={data.users} /> : <Avatar user={otherUser} />}

      <div className="min-w-0 flex-1">
        <div className="focus:outline-none">
          <span className="absolute inset-0" aria-hidden="true" />
          <div className="flex justify-between items-center mb-0.5">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {data.name || otherUser.name}
            </p>
            {lastMessage?.createdAt && (
              <p
                className={clsx(
                  "text-[11px] font-medium",
                  !hasSeen
                    ? "text-sky-600 dark:text-sky-400 font-semibold"
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                {format(new Date(lastMessage.createdAt), "p")}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-1">
            <p
              className={clsx(
                `truncate text-xs`,
                hasSeen
                  ? "text-slate-500 dark:text-slate-400 font-normal"
                  : "text-slate-900 font-semibold dark:text-white"
              )}
            >
              {lastMessageText}
            </p>
            {!hasSeen && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationBox;

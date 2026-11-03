"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { MdOutlineGroupAdd } from "react-icons/md";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";

import { User } from "@prisma/client";
import { find } from "lodash";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import GroupChatModal from "../../components/modals/GroupChatModal";
import useConversation from "../../hooks/useConversation";
import { pusherClient, pusherEvents } from "../../libs/pusher";
import { FullConversationType } from "../../types";
import ConversationBox from "./ConversationBox";

interface ConversationListProps {
  initialItems: FullConversationType[];
  users: User[];
}

const ConversationList: React.FC<ConversationListProps> = ({ initialItems, users }) => {
  const [items, setItems] = useState(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();
  const session = useSession();

  const { conversationId, isOpen } = useConversation();

  const pusherKey = useMemo(() => {
    return session.data?.user?.email;
  }, [session.data?.user?.email]);

  useEffect(() => {
    if (!pusherKey) {
      return;
    }

    pusherClient.subscribe(pusherKey);

    const updateHandler = (conversation: FullConversationType) => {
      setItems((current) =>
        current.map((currentConversation) => {
          if (currentConversation.id === conversation.id) {
            return {
              ...currentConversation,
              messages: conversation.messages,
            };
          }

          return currentConversation;
        })
      );
    };

    const newHandler = (conversation: FullConversationType) => {
      setItems((current) => {
        // skip if the conversation already exists
        if (find(current, { id: conversation.id })) {
          return current;
        }

        return [conversation, ...current];
      });
    };

    const removeHandler = (conversation: FullConversationType) => {
      setItems((current) => {
        return [...current.filter((convo) => convo.id !== conversation.id)];
      });

      if (conversationId == conversation.id) {
        router.push("/conversations");
      }
    };

    pusherClient.bind(pusherEvents.UPDATE_CONVERSATION, updateHandler);
    pusherClient.bind(pusherEvents.NEW_CONVERSATION, newHandler);
    pusherClient.bind(pusherEvents.DELETE_CONVERSATION, removeHandler);

    return () => {
      pusherClient.unsubscribe(pusherKey);
      pusherClient.unbind(pusherEvents.UPDATE_CONVERSATION, updateHandler);
      pusherClient.unbind(pusherEvents.NEW_CONVERSATION, newHandler);
      pusherClient.unbind(pusherEvents.DELETE_CONVERSATION, removeHandler);
    };
  }, [conversationId, pusherKey, router]);

  // Filter conversations by search term
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();

    return items.filter((convo) => {
      // Check group name
      if (convo.name && convo.name.toLowerCase().includes(query)) return true;
      // Check other users' names or emails
      return convo.users.some(
        (u) =>
          (u.name && u.name.toLowerCase().includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query))
      );
    });
  }, [items, searchQuery]);

  return (
    <>
      <GroupChatModal users={users} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <aside
        className={clsx(
          `
          fixed 
          inset-y-0 
          pb-20
          lg:pb-0
          lg:left-20 
          lg:w-80 
          lg:block
          overflow-y-auto 
          border-r 
          border-slate-200/80 
          bg-white/95
          backdrop-blur-sm
          dark:bg-[#16171a]/95
          dark:border-slate-800/80
        `,
          isOpen ? "hidden" : "block w-full left-0"
        )}
      >
        <div className="px-5">
          {/* Header */}
          <div className="flex items-center justify-between pt-5 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Messages
              </h2>
              {items.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {items.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              title="Create Group Chat"
              className="
                rounded-xl 
                p-2.5 
                bg-slate-100 
                text-slate-600 
                cursor-pointer 
                hover:bg-sky-50
                hover:text-sky-600
                transition-all
                duration-150
                active:scale-95
                dark:bg-slate-800 
                dark:text-slate-300
                dark:hover:bg-slate-700
                dark:hover:text-sky-400
              "
            >
              <MdOutlineGroupAdd size={20} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="
                w-full 
                pl-9 
                pr-8 
                py-2 
                text-sm 
                rounded-xl 
                bg-slate-100/90 
                border-0 
                text-slate-800 
                placeholder-slate-400 
                focus:ring-2 
                focus:ring-sky-500 
                transition-all
                dark:bg-slate-800/80 
                dark:text-slate-100 
                dark:placeholder-slate-500
              "
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <HiXMark className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Conversation boxes */}
          <div className="space-y-1">
            {filteredItems.map((item) => (
              <ConversationBox key={item.id} data={item} selected={conversationId === item.id} />
            ))}

            {/* Empty state for search */}
            {searchQuery && filteredItems.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No chats found matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default ConversationList;

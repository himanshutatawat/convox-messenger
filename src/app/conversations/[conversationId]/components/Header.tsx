"use client";

import { useMemo, useState, memo } from "react";
import { HiChevronLeft } from "react-icons/hi";
import { HiEllipsisHorizontal, HiMagnifyingGlass, HiXMark } from "react-icons/hi2";
import Link from "next/link";

import useOtherUser from "@/app/hooks/useOtherUser";
import { Conversation, User } from "@prisma/client";
import Avatar from "../../../components/Avatar";
import AvatarGroup from "../../../components/AvatarGroup";
import useActiveList from "../../../hooks/useActiveList";
import useChatSearch from "../../../hooks/useChatSearch";
import ChatDrawer from "./ChatDrawer";

interface HeaderProps {
  conversation: Conversation & {
    users: User[];
  };
  messages?: any[];
}

const Header: React.FC<HeaderProps> = ({ conversation, messages = [] }) => {
  const otherUser = useOtherUser(conversation);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchQuery = useChatSearch((state) => state.searchQuery);
  const setSearchQuery = useChatSearch((state) => state.setSearchQuery);
  const isSearching = useChatSearch((state) => state.isSearching);
  const setIsSearching = useChatSearch((state) => state.setIsSearching);

  const isActive = useActiveList((state) =>
    otherUser?.email ? state.members.includes(otherUser.email) : false
  );
  const statusText = useMemo(() => {
    if (conversation.isGroup) {
      return `${conversation.users.length} members`;
    }

    return isActive ? "Active now" : "Offline";
  }, [conversation.isGroup, conversation.users.length, isActive]);

  return (
    <>
      <ChatDrawer
        data={conversation}
        messages={messages}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div
        className="
        bg-white/95 
        w-full 
        flex 
        border-b 
        border-slate-200/80
        sm:px-4 
        py-2.5 
        px-4 
        lg:px-6 
        justify-between 
        items-center 
        shadow-sm
        backdrop-blur-sm
        dark:bg-[#16171a]/95
        dark:border-slate-800/80
      "
      >
        <div className="flex gap-3 items-center min-w-0 flex-1">
          <Link
            href="/conversations"
            className="
            lg:hidden 
            block 
            text-sky-500 
            hover:text-sky-600 
            transition 
            cursor-pointer
          "
          >
            <HiChevronLeft size={28} />
          </Link>
          {conversation.isGroup ? (
            <AvatarGroup users={conversation.users} />
          ) : (
            <Avatar user={otherUser} />
          )}

          {isSearching ? (
            <div className="relative flex-1 max-w-md animate-in fade-in duration-150">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages in this chat..."
                className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearching(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <HiXMark className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {conversation.name || otherUser.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                {!conversation.isGroup && isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <span>{statusText}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* In-chat search toggle */}
          <button
            type="button"
            onClick={() => setIsSearching(!isSearching)}
            title="Search in chat"
            className={`p-2 rounded-xl transition ${
              isSearching
                ? "bg-sky-50 text-sky-600 dark:bg-slate-800 dark:text-sky-400"
                : "text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <HiMagnifyingGlass size={20} />
          </button>

          {/* Options Drawer */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            title="Chat info & settings"
            className="
              p-2
              rounded-xl
              text-slate-500
              hover:text-sky-600
              hover:bg-slate-100
              dark:hover:bg-slate-800
              transition
            "
          >
            <HiEllipsisHorizontal size={24} />
          </button>
        </div>
      </div>
    </>
  );
};

export default memo(Header);

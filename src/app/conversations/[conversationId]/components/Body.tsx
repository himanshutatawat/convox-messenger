"use client";

import axios from "axios";
import { useEffect, useRef, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import useConversation from "@/app/hooks/useConversation";
import { find } from "lodash";
import { HiBookmark, HiXMark } from "react-icons/hi2";

import { pusherClient, pusherEvents } from "../../../libs/pusher";
import { sounds } from "../../../libs/soundEffects";
import { FullMessageType } from "../../../types";
import useChatSearch from "../../../hooks/useChatSearch";
import MessageBox from "./MessageBox";

interface BodyProps {
  initialMessages: FullMessageType[];
}

const Body: React.FC<BodyProps> = ({ initialMessages = [] }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const session = useSession();
  const { conversationId } = useConversation();
  const { searchQuery } = useChatSearch();

  useEffect(() => {
    axios.post(`/api/conversations/${conversationId}/seen`);
  }, [conversationId]);

  useEffect(() => {
    bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    pusherClient.subscribe(conversationId);
    bottomRef?.current?.scrollIntoView();

    const messageHandler = (message: FullMessageType) => {
      axios.post(`/api/conversations/${conversationId}/seen`);

      // Play soft incoming message cue if from another user
      if (session.data?.user?.email !== message.sender?.email) {
        sounds.playReceived();
      }

      setMessages((current) => {
        if (find(current, { id: message.id })) {
          return current;
        }

        return [...current, message];
      });
    };

    const updateMessageHandler = (newMessage: FullMessageType) => {
      setMessages((current) =>
        current.map((currentMessage) => {
          if (currentMessage.id === newMessage.id) {
            return newMessage;
          }

          return currentMessage;
        })
      );
    };

    const typingHandler = (data: { userId: string; userName: string; isTyping: boolean }) => {
      const currentUserId = (session.data?.user as any)?.id;
      if (data.userId === currentUserId) return;

      if (data.isTyping) {
        setTypingUser(data.userName);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser(null);
        }, 3000);
      } else {
        setTypingUser(null);
      }
    };

    pusherClient.bind(pusherEvents.NEW_MESSAGE, messageHandler);
    pusherClient.bind(pusherEvents.UPDATE_MESSAGE, updateMessageHandler);
    pusherClient.bind("typing", typingHandler);

    return () => {
      pusherClient.unsubscribe(conversationId);
      pusherClient.unbind(pusherEvents.NEW_MESSAGE, messageHandler);
      pusherClient.unbind(pusherEvents.UPDATE_MESSAGE, updateMessageHandler);
      pusherClient.unbind("typing", typingHandler);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, session.data?.user]);

  // Find pinned messages
  const pinnedMessages = useMemo(() => {
    return messages.filter((m: any) => m.isPinned);
  }, [messages]);

  // Filter messages if search query is active
  const displayedMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter((m) => m.body && m.body.toLowerCase().includes(query));
  }, [messages, searchQuery]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2 bg-amber-50/95 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-800/40 backdrop-blur-sm text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              <HiBookmark className="w-3.5 h-3.5" />
            </span>
            <span className="font-bold text-amber-800 dark:text-amber-300">
              Pinned ({pinnedMessages.length}):
            </span>
            <span className="truncate text-slate-700 dark:text-slate-300 max-w-sm sm:max-w-md">
              {pinnedMessages[pinnedMessages.length - 1].body || "Attachment"}
            </span>
          </div>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {searchQuery && displayedMessages.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">
            No messages found containing &ldquo;{searchQuery}&rdquo;
          </div>
        )}

        {displayedMessages.map((message, i) => (
          <MessageBox
            isLast={i === displayedMessages.length - 1}
            key={message.id}
            data={message}
          />
        ))}

        {/* Live Typing Indicator */}
        {typingUser && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500 dark:text-slate-400 animate-in fade-in duration-150">
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:0.3s]" />
            </div>
            <span className="font-medium">{typingUser} is typing...</span>
          </div>
        )}

        <div className="pt-2" ref={bottomRef} />
      </div>
    </div>
  );
};

export default Body;

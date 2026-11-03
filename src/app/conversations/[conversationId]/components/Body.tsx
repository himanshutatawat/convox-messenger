"use client";

import axios from "axios";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import useConversation from "@/app/hooks/useConversation";
import { find } from "lodash";
import { HiBookmark } from "react-icons/hi2";

import { pusherClient, pusherEvents } from "../../../libs/pusher";
import { sounds } from "../../../libs/soundEffects";
import { FullMessageType } from "../../../types";
import useChatSearch from "../../../hooks/useChatSearch";
import MessageBox from "./MessageBox";

interface BodyProps {
  initialMessages: FullMessageType[];
}

const Body: React.FC<BodyProps> = ({ initialMessages = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const [messages, setMessages] = useState(initialMessages);
  const [hasMore, setHasMore] = useState(initialMessages.length >= 30);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const session = useSession();
  const { conversationId } = useConversation();
  const { searchQuery } = useChatSearch();

  useEffect(() => {
    axios.post(`/api/conversations/${conversationId}/seen`);
  }, [conversationId]);

  // Initial scroll to bottom
  useEffect(() => {
    if (isInitialMount.current) {
      bottomRef?.current?.scrollIntoView();
      isInitialMount.current = false;
    }
  }, []);

  // Scroll to bottom on new message if user is near bottom
  const scrollToBottom = useCallback(() => {
    bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Handle infinite scroll up for older messages
  const handleScroll = async () => {
    const container = containerRef.current;
    if (!container || isLoadingOlder || !hasMore || messages.length === 0) return;

    if (container.scrollTop < 60) {
      setIsLoadingOlder(true);
      const oldestMessage = messages[0];
      const previousScrollHeight = container.scrollHeight;

      try {
        const response = await axios.get(
          `/api/conversations/${conversationId}/messages?cursor=${oldestMessage.id}&limit=30`
        );
        const olderMessages: FullMessageType[] = response.data;

        if (olderMessages.length < 30) {
          setHasMore(false);
        }

        if (olderMessages.length > 0) {
          setMessages((current) => [...olderMessages, ...current]);

          // Maintain user's scroll position
          requestAnimationFrame(() => {
            if (containerRef.current) {
              containerRef.current.scrollTop =
                containerRef.current.scrollHeight - previousScrollHeight;
            }
          });
        }
      } catch (err) {
        console.error("Error loading older messages:", err);
      } finally {
        setIsLoadingOlder(false);
      }
    }
  };

  useEffect(() => {
    pusherClient.subscribe(conversationId);

    const messageHandler = (message: FullMessageType) => {
      axios.post(`/api/conversations/${conversationId}/seen`);

      if (session.data?.user?.email !== message.sender?.email) {
        sounds.playReceived();
      }

      setMessages((current) => {
        if (find(current, { id: message.id })) {
          return current;
        }
        return [...current, message];
      });

      scrollToBottom();
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
  }, [conversationId, session.data?.user, scrollToBottom]);

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
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 py-4"
      >
        {isLoadingOlder && (
          <div className="py-2 text-center text-xs text-slate-400 animate-pulse">
            Loading older messages...
          </div>
        )}

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

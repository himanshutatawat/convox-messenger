"use client";

import axios from "axios";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import useConversation from "@/app/hooks/useConversation";
import { find } from "lodash";
import { HiBookmark } from "react-icons/hi2";
import { useVirtualizer } from "@tanstack/react-virtual";

import { pusherClient, pusherEvents } from "../../../libs/pusher";
import { sounds } from "../../../libs/soundEffects";
import { FullMessageType } from "../../../types";
import useChatSearch from "../../../hooks/useChatSearch";
import useOptimisticMessages from "../../../hooks/useOptimisticMessages";
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
  const seenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const session = useSession();
  const { conversationId } = useConversation();
  const searchQuery = useChatSearch((state) => state.searchQuery);
  const pendingMessages = useOptimisticMessages((state) => state.pendingMessages);
  const removePendingMessage = useOptimisticMessages((state) => state.removePendingMessage);

  // Stable session references to avoid tearing down Pusher listeners
  const currentEmailRef = useRef(session.data?.user?.email);
  const currentIdRef = useRef((session.data?.user as any)?.id);
  useEffect(() => {
    currentEmailRef.current = session.data?.user?.email;
    currentIdRef.current = (session.data?.user as any)?.id;
  }, [session.data?.user]);

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

  // Debounced "mark as seen" only if latest message is unseen and from another user
  const sendSeen = useCallback(
    (targetMessage?: FullMessageType) => {
      const email = currentEmailRef.current;
      const id = currentIdRef.current;
      if (!email || !conversationId) return;

      const latest = targetMessage || messages[messages.length - 1];
      if (!latest) return;

      // Skip if our own message
      if (latest.sender?.email === email || (latest.senderId && latest.senderId === id)) {
        return;
      }

      // Skip if already seen by current user
      const alreadySeen =
        (latest.seenIds && latest.seenIds.includes(id)) ||
        latest.seen?.some((u) => u.email === email || u.id === id);

      if (alreadySeen) return;

      axios.post(`/api/conversations/${conversationId}/seen`).catch(() => {});
    },
    [conversationId, messages]
  );

  const debouncedSendSeen = useCallback(
    (targetMessage?: FullMessageType) => {
      if (seenTimeoutRef.current) clearTimeout(seenTimeoutRef.current);
      seenTimeoutRef.current = setTimeout(() => {
        sendSeen(targetMessage);
      }, 300);
    },
    [sendSeen]
  );

  // Check seen on initial mount or conversation switch
  useEffect(() => {
    debouncedSendSeen();
  }, [conversationId, debouncedSendSeen]);

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

  // Pusher real-time event subscriptions
  useEffect(() => {
    pusherClient.subscribe(conversationId);

    const messageHandler = (message: FullMessageType) => {
      // Reconcile optimistic message if tempId matches
      if (message.tempId) {
        removePendingMessage(message.tempId);
      }

      const myEmail = currentEmailRef.current;
      if (myEmail && message.sender?.email !== myEmail) {
        sounds.playReceived();
        debouncedSendSeen(message);
      }

      setMessages((current) => {
        // Skip duplicate real messages
        if (find(current, { id: message.id })) {
          return current;
        }

        // Reconcile if message contains a tempId already in state
        if (
          message.tempId &&
          current.some((m) => m.tempId === message.tempId || m.id === message.tempId)
        ) {
          return current.map((m) =>
            m.tempId === message.tempId || m.id === message.tempId ? message : m
          );
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
      const currentUserId = currentIdRef.current;
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
      if (seenTimeoutRef.current) clearTimeout(seenTimeoutRef.current);
    };
  }, [conversationId, debouncedSendSeen, removePendingMessage, scrollToBottom]);

  // Merge optimistic pending messages for this conversation
  const activePending = useMemo(() => {
    return pendingMessages.filter((m) => m.conversationId === conversationId);
  }, [pendingMessages, conversationId]);

  const allMessages = useMemo(() => {
    if (activePending.length === 0) return messages;
    const existingIds = new Set(messages.map((m) => m.id));
    const unconfirmed = activePending.filter(
      (m) => !existingIds.has(m.id) && (!m.tempId || !existingIds.has(m.tempId))
    );
    return [...messages, ...unconfirmed];
  }, [messages, activePending]);

  // Find pinned messages
  const pinnedMessages = useMemo(() => {
    return allMessages.filter((m: any) => m.isPinned);
  }, [allMessages]);

  // Filter messages if search query is active
  const displayedMessages = useMemo(() => {
    if (!searchQuery.trim()) return allMessages;
    const query = searchQuery.toLowerCase();
    return allMessages.filter((m) => m.body && m.body.toLowerCase().includes(query));
  }, [allMessages, searchQuery]);

  // Virtualizer for smooth scrolling and low DOM overhead
  const rowVirtualizer = useVirtualizer({
    count: displayedMessages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 72,
    overscan: 6,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

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

        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualItem) => {
            const message = displayedMessages[virtualItem.index];
            return (
              <div
                key={message.tempId || message.id}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <MessageBox
                  isLast={virtualItem.index === displayedMessages.length - 1}
                  data={message}
                />
              </div>
            );
          })}
        </div>

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

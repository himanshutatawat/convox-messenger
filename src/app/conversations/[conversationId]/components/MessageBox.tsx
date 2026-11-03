"use client";

import clsx from "clsx";
import { useState, useCallback, useMemo, memo } from "react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import Image from "next/image";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";
import {
  HiClipboardDocument,
  HiCheck,
  HiFaceSmile,
  HiArrowUturnLeft,
  HiPencil,
  HiTrash,
  HiBookmark,
  HiStar,
  HiXMark,
} from "react-icons/hi2";

import Avatar from "../../../components/Avatar";
import AudioPlayer from "../../../components/AudioPlayer";
import LinkPreview from "../../../components/LinkPreview";
import useReplyMessage from "../../../hooks/useReplyMessage";
import { sounds } from "../../../libs/soundEffects";
import { FullMessageType, MessageReaction, OGData } from "../../../types";
import ImageModal from "./ImageModal";

interface MessageBoxProps {
  data: FullMessageType;
  isLast?: boolean;
}

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "😂", "🎉", "😮"];

const MessageBox: React.FC<MessageBoxProps> = ({ data, isLast }) => {
  const session = useSession();
  const setReplyMessage = useReplyMessage((state) => state.setReplyMessage);

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(data.body || "");

  const isOwn = session.data?.user?.email === data?.sender?.email;
  const currentUserId = (session.data?.user as any)?.id;

  const isPinned = (data as any).isPinned;
  const isDeleted = (data as any).isDeleted;
  const editedAt = (data as any).editedAt;
  const starredByIds = (data as any).starredByIds || [];
  const isStarred = currentUserId && starredByIds.includes(currentUserId);

  const seenUsers = useMemo(() => {
    return (data.seen || []).filter((user) => user.email !== data?.sender?.email);
  }, [data.seen, data.sender?.email]);

  const handleCopy = useCallback(() => {
    if (!data.body) return;
    navigator.clipboard.writeText(data.body);
    setCopied(true);
    toast.success("Message copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, [data.body]);

  const handleReaction = useCallback(
    async (emoji: string) => {
      sounds.playPop();
      setShowReactionPicker(false);
      try {
        await axios.post(`/api/messages/${data.id}/reactions`, { emoji });
      } catch {
        toast.error("Could not add reaction");
      }
    },
    [data.id]
  );

  const handleSaveEdit = useCallback(async () => {
    if (!editText.trim()) return;
    try {
      await axios.patch(`/api/messages/${data.id}`, { message: editText });
      setIsEditing(false);
      toast.success("Message updated");
    } catch {
      toast.error("Failed to edit message");
    }
  }, [data.id, editText]);

  const handleUnsend = useCallback(async () => {
    if (!confirm("Are you sure you want to unsend this message?")) return;
    try {
      await axios.delete(`/api/messages/${data.id}`);
      toast.success("Message unsent");
    } catch {
      toast.error("Failed to unsend message");
    }
  }, [data.id]);

  const handleTogglePin = useCallback(async () => {
    try {
      await axios.post(`/api/messages/${data.id}/pin`);
      toast.success(isPinned ? "Message unpinned" : "Message pinned");
    } catch {
      toast.error("Failed to pin message");
    }
  }, [data.id, isPinned]);

  const handleToggleStar = useCallback(async () => {
    try {
      await axios.post(`/api/messages/${data.id}/star`);
      toast.success(isStarred ? "Removed from starred" : "Message starred");
    } catch {
      toast.error("Failed to star message");
    }
  }, [data.id, isStarred]);

  const reactionsList: MessageReaction[] = useMemo(() => {
    return Array.isArray(data.reactions)
      ? (data.reactions as unknown as MessageReaction[])
      : [];
  }, [data.reactions]);

  const container = clsx("flex gap-3 px-4 py-2 group select-text", isOwn && "justify-end");
  const avatar = clsx(isOwn && "order-2");
  const body = clsx("flex flex-col gap-1 max-w-[85%] sm:max-w-[70%]", isOwn && "items-end");

  const messageBubble = clsx(
    "relative text-sm w-fit overflow-hidden transition-all duration-150 leading-relaxed shadow-sm",
    isDeleted
      ? "bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 italic rounded-2xl py-2 px-3.5 border border-dashed border-slate-300 dark:border-slate-700"
      : isOwn
      ? "bg-gradient-to-r from-indigo-500 to-sky-500 text-white rounded-2xl rounded-tr-sm shadow-sky-500/20"
      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-slate-200/60 dark:border-slate-700/60",
    !isDeleted && (data.image ? "p-0 rounded-2xl" : data.audio ? "p-1 rounded-2xl" : "py-2.5 px-4"),
    data.status === "sending" && "opacity-75",
    data.status === "error" && "border-2 border-rose-400"
  );

  const content = (
    <>
      {!isOwn && (
        <div className={avatar}>
          <Avatar user={data.sender} />
        </div>
      )}
      <div className={body}>
        {/* Header: Sender, Timestamp, Pin & Star badges */}
        <div className="flex items-center gap-1.5 px-1">
          {!isOwn && (
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {data.sender.name}
            </span>
          )}
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {format(new Date(data.createdAt), "p")}
          </span>
          {data.status === "sending" && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              sending...
            </span>
          )}
          {data.status === "error" && (
            <span className="text-[10px] text-rose-500 font-medium flex items-center gap-1">
              ⚠️ Failed to send
            </span>
          )}
          {editedAt && !isDeleted && (
            <span className="text-[10px] text-slate-400 italic">(edited)</span>
          )}
          {isPinned && (
            <span title="Pinned message" className="text-amber-500">
              <HiBookmark className="w-3.5 h-3.5" />
            </span>
          )}
          {isStarred && (
            <span title="Starred message" className="text-amber-400">
              <HiStar className="w-3.5 h-3.5 fill-current" />
            </span>
          )}
        </div>

        {/* Quoted Reply Block (Thread) */}
        {data.replyTo && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs mb-0.5 border ${
              isOwn
                ? "bg-sky-500/10 border-sky-400/20 text-slate-700 dark:text-slate-300"
                : "bg-slate-200/50 border-slate-300/40 dark:bg-slate-800/50 dark:border-slate-700/40 text-slate-600 dark:text-slate-300"
            }`}
          >
            <span className="text-sky-500 font-bold">↩</span>
            <span className="font-semibold">{data.replyTo.sender?.name || "User"}:</span>
            <span className="truncate max-w-[200px] sm:max-w-xs text-slate-500 dark:text-slate-400">
              {data.replyTo.body || (data.replyTo.audio ? "🎤 Voice note" : "📷 Photo")}
            </span>
          </div>
        )}

        {/* Bubble Row with Hover Actions or Inline Editor */}
        <div className={`relative flex items-center gap-1.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <div className={messageBubble}>
            <ImageModal
              src={data.image}
              isOpen={imageModalOpen}
              onClose={() => setImageModalOpen(false)}
            />

            {/* If user is currently editing their message */}
            {isEditing ? (
              <div className="flex flex-col gap-2 p-1 min-w-[240px]">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full text-xs sm:text-sm py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 text-xs rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-2.5 py-1 text-xs rounded-lg bg-sky-500 text-white font-semibold hover:bg-sky-600 transition shadow-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Deleted state */}
                {isDeleted ? (
                  <div>🚫 This message was unsent</div>
                ) : (
                  <>
                    {/* Image attachment */}
                    {data.image && (
                      <Image
                        alt="Uploaded media"
                        height="288"
                        width="288"
                        onClick={() => setImageModalOpen(true)}
                        src={data.image}
                        className="
                          object-cover 
                          cursor-pointer 
                          hover:opacity-95 
                          transition
                          rounded-2xl
                        "
                      />
                    )}

                    {/* Audio message / Voice note */}
                    {data.audio && <AudioPlayer src={data.audio} isOwn={isOwn} />}

                    {/* Text body */}
                    {data.body && <div className="break-words select-text">{data.body}</div>}

                    {/* Rich OpenGraph Card Preview */}
                    {data.ogData && (
                      <LinkPreview data={data.ogData as unknown as OGData} isOwn={isOwn} />
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Hover Action Bar (only if not deleted) */}
          {!isDeleted && !isEditing && (
            <div
              className={`
                opacity-0 
                group-hover:opacity-100 
                transition-opacity 
                flex 
                items-center 
                gap-1 
                bg-white/95 
                dark:bg-slate-800/95 
                border 
                border-slate-200/80 
                dark:border-slate-700/80 
                rounded-xl 
                p-1 
                shadow-md 
                backdrop-blur-sm
                z-20
              `}
            >
              {/* Thread Reply Button */}
              <button
                type="button"
                onClick={() => setReplyMessage(data)}
                title="Reply in thread"
                className="p-1 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <HiArrowUturnLeft className="w-4 h-4" />
              </button>

              {/* Reaction Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  title="Add reaction"
                  className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <HiFaceSmile className="w-4 h-4" />
                </button>

                {showReactionPicker && (
                  <div
                    className={`
                      absolute bottom-full mb-1 z-30 flex gap-1 p-1.5 bg-white dark:bg-slate-800 
                      rounded-xl shadow-xl border border-slate-200 dark:border-slate-700
                      ${isOwn ? "right-0" : "left-0"}
                    `}
                  >
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleReaction(emoji)}
                        className="text-base p-1 hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pin / Unpin Button */}
              <button
                type="button"
                onClick={handleTogglePin}
                title={isPinned ? "Unpin message" : "Pin message"}
                className={`p-1 rounded-lg transition ${
                  isPinned
                    ? "text-amber-500 bg-amber-50 dark:bg-amber-950/60"
                    : "text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <HiBookmark className="w-4 h-4" />
              </button>

              {/* Star / Unstar Button */}
              <button
                type="button"
                onClick={handleToggleStar}
                title={isStarred ? "Remove star" : "Star message"}
                className={`p-1 rounded-lg transition ${
                  isStarred
                    ? "text-amber-400 bg-amber-50 dark:bg-amber-950/60"
                    : "text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <HiStar className={`w-4 h-4 ${isStarred ? "fill-current" : ""}`} />
              </button>

              {/* Edit Button (Own message only) */}
              {isOwn && data.body && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  title="Edit message"
                  className="p-1 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <HiPencil className="w-4 h-4" />
                </button>
              )}

              {/* Unsend Button (Own message only) */}
              {isOwn && (
                <button
                  type="button"
                  onClick={handleUnsend}
                  title="Unsend message"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 transition"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              )}

              {/* Copy Button */}
              {data.body && (
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy message"
                  className="p-1 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  {copied ? (
                    <HiCheck className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <HiClipboardDocument className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reaction Chips (synced with DB & Pusher) */}
        {!isDeleted && reactionsList.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5 px-1">
            {reactionsList.map((reaction) => {
              const hasUserReacted =
                currentUserId && reaction.userIds.includes(currentUserId);
              const tooltip = reaction.userNames ? reaction.userNames.join(", ") : "";

              return (
                <button
                  key={reaction.emoji}
                  type="button"
                  title={tooltip}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border shadow-sm transition hover:scale-105 active:scale-95
                    ${
                      hasUserReacted
                        ? "bg-sky-50 border-sky-300 dark:bg-sky-950/60 dark:border-sky-700 text-sky-700 dark:text-sky-300"
                        : "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }
                  `}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-[10px] font-bold">
                    {reaction.userIds.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Read receipts: Avatar Row of seen members */}
        {isLast && isOwn && seenUsers.length > 0 && (
          <div className="flex items-center gap-1.5 px-1 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="text-sky-500 font-semibold">✓✓</span>
            <div className="flex -space-x-1.5 overflow-hidden items-center">
              {seenUsers.map((user) => (
                <div
                  key={user.id}
                  title={`Seen by ${user.name}`}
                  className="relative w-4 h-4 rounded-full overflow-hidden ring-1 ring-white dark:ring-slate-900"
                >
                  <Image
                    src={user.image || "/images/avatar-placeholder.png"}
                    alt={user.name || "User"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
            <span className="text-[10px]">
              {seenUsers.map((u) => u.name).join(", ")}
            </span>
          </div>
        )}
      </div>
    </>
  );

  if (isLast) {
    return (
      <motion.div
        initial={{ opacity: 0, transform: "translateY(8px)" }}
        animate={{ opacity: 1, transform: "translateY(0px)" }}
        transition={{ duration: 0.15 }}
        className={container}
      >
        {content}
      </motion.div>
    );
  }

  return <div className={container}>{content}</div>;
};

export default memo(MessageBox);

"use client";

import axios from "axios";
import { useState, useRef, useEffect, useCallback } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import {
  HiPaperAirplane,
  HiPhoto,
  HiFaceSmile,
  HiMicrophone,
  HiXMark,
  HiTrash,
} from "react-icons/hi2";
import { CldUploadButton } from "next-cloudinary";
import toast from "react-hot-toast";

import useConversation from "../../../hooks/useConversation";
import useReplyMessage from "../../../hooks/useReplyMessage";
import useOptimisticMessages from "../../../hooks/useOptimisticMessages";
import dynamic from "next/dynamic";
import { sounds } from "../../../libs/soundEffects";
import { FullMessageType } from "../../../types";
import MessageInput from "./MessageInput";

const GifPicker = dynamic(() => import("../../../components/GifPicker"), { ssr: false });

const POPULAR_EMOJIS = [
  "😀", "😂", "😍", "🔥", "👍", "❤️", "🎉", "✨",
  "🚀", "👏", "🙌", "💯", "😎", "🤩", "🤝", "💡",
  "⚡", "👀", "🥳", "🙏", "💪", "👌", "🍕", "☕",
];

const Form = () => {
  const session = useSession();
  const { conversationId } = useConversation();
  const replyMessage = useReplyMessage((state) => state.replyMessage);
  const setReplyMessage = useReplyMessage((state) => state.setReplyMessage);
  const addPendingMessage = useOptimisticMessages((state) => state.addPendingMessage);
  const removePendingMessage = useOptimisticMessages((state) => state.removePendingMessage);
  const updatePendingStatus = useOptimisticMessages((state) => state.updatePendingStatus);

  const [showEmojis, setShowEmojis] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      message: "",
    },
  });

  const currentMessage = watch("message") || "";

  const createOptimisticMessage = useCallback(
    (fields: Partial<FullMessageType>): FullMessageType => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const currentUserId = (session.data?.user as any)?.id || "";
      return {
        id: tempId,
        tempId,
        body: fields.body || null,
        image: fields.image || null,
        audio: fields.audio || null,
        createdAt: new Date(),
        seen: [],
        seenIds: [],
        conversationId,
        senderId: currentUserId,
        sender: {
          id: currentUserId,
          name: session.data?.user?.name || "You",
          email: session.data?.user?.email || "",
          image: session.data?.user?.image || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          conversationIds: [],
          seenMessageIds: [],
          hashedPassword: null,
          emailVerified: null,
        },
        replyTo: replyMessage || null,
        replyToId: replyMessage?.id || null,
        reactions: [],
        ogData: null,
        isPinned: false,
        starredByIds: [],
        isDeleted: false,
        editedAt: null,
        status: "sending",
        ...fields,
      } as FullMessageType;
    },
    [conversationId, replyMessage, session.data?.user]
  );

  // Handle typing indicator trigger
  useEffect(() => {
    if (currentMessage.trim().length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        axios.post(`/api/conversations/${conversationId}/typing`, { isTyping: true }).catch(() => {});
      }

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        axios.post(`/api/conversations/${conversationId}/typing`, { isTyping: false }).catch(() => {});
      }, 2500);
    }
  }, [currentMessage, conversationId]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    if (!data.message?.trim()) return;

    const messageText = data.message;
    const parentReplyId = replyMessage?.id;

    setValue("message", "", { shouldValidate: true });
    setShowEmojis(false);
    setShowGifs(false);
    setReplyMessage(null);

    // Stop typing indicator immediately
    isTypingRef.current = false;
    axios.post(`/api/conversations/${conversationId}/typing`, { isTyping: false }).catch(() => {});

    sounds.playSent();

    const optimisticMsg = createOptimisticMessage({ body: messageText });
    addPendingMessage(optimisticMsg);

    axios
      .post("/api/messages", {
        message: messageText,
        replyToId: parentReplyId,
        conversationId,
        tempId: optimisticMsg.tempId,
      })
      .then(() => {
        removePendingMessage(optimisticMsg.tempId!);
      })
      .catch(() => {
        updatePendingStatus(optimisticMsg.tempId!, "error");
        toast.error("Failed to send message.");
      });
  };

  const handleUpload = (result: any) => {
    sounds.playSent();
    const parentReplyId = replyMessage?.id;
    setReplyMessage(null);

    const imageUrl = result.info.secure_url;
    const optimisticMsg = createOptimisticMessage({ image: imageUrl });
    addPendingMessage(optimisticMsg);

    axios
      .post("/api/messages", {
        image: imageUrl,
        replyToId: parentReplyId,
        conversationId,
        tempId: optimisticMsg.tempId,
      })
      .then(() => {
        removePendingMessage(optimisticMsg.tempId!);
      })
      .catch(() => {
        updatePendingStatus(optimisticMsg.tempId!, "error");
        toast.error("Failed to upload image.");
      });
  };

  const handleSelectGif = (gifUrl: string) => {
    sounds.playSent();
    const parentReplyId = replyMessage?.id;
    setReplyMessage(null);

    const optimisticMsg = createOptimisticMessage({ image: gifUrl });
    addPendingMessage(optimisticMsg);

    axios
      .post("/api/messages", {
        image: gifUrl,
        replyToId: parentReplyId,
        conversationId,
        tempId: optimisticMsg.tempId,
      })
      .then(() => {
        removePendingMessage(optimisticMsg.tempId!);
      })
      .catch(() => {
        updatePendingStatus(optimisticMsg.tempId!, "error");
        toast.error("Failed to send GIF.");
      });
  };

  const handleEmojiClick = (emoji: string) => {
    setValue("message", currentMessage + emoji, { shouldValidate: true });
  };

  // --- Voice Notes: Native MediaRecorder API ---
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Audio recording is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Microphone access was denied or unavailable.");
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  };

  const sendRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      setIsRecording(false);
      setRecordingDuration(0);

      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());

      const parentReplyId = replyMessage?.id;
      setReplyMessage(null);

      const toastId = toast.loading("Sending voice note...");

      try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME;

        let audioUrl = "";

        if (cloudName && preset && cloudName !== "placeholder") {
          const formData = new FormData();
          formData.append("file", audioBlob);
          formData.append("upload_preset", preset);

          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
            method: "POST",
            body: formData,
          });

          const json = await res.json();
          audioUrl = json.secure_url;
        }

        if (!audioUrl) {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          audioUrl = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
          });
        }

        sounds.playSent();

        const optimisticMsg = createOptimisticMessage({ audio: audioUrl });
        addPendingMessage(optimisticMsg);

        await axios.post("/api/messages", {
          audio: audioUrl,
          replyToId: parentReplyId,
          conversationId,
          tempId: optimisticMsg.tempId,
        });

        removePendingMessage(optimisticMsg.tempId!);
        toast.success("Voice note sent!", { id: toastId });
      } catch (err) {
        console.error("Voice note error:", err);
        toast.error("Could not send voice note", { id: toastId });
      }
    };

    mediaRecorderRef.current.stop();
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <div className="relative w-full border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#16171a]">
      {/* Threaded Reply Banner */}
      {replyMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-sky-50 dark:bg-slate-800/80 border-b border-sky-100 dark:border-slate-700/80 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sky-600 dark:text-sky-400 font-bold">↩ Replying to</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {replyMessage.sender?.name || "User"}:
            </span>
            <span className="truncate text-slate-500 dark:text-slate-400 max-w-[200px] sm:max-w-md">
              {replyMessage.body || (replyMessage.audio ? "🎤 Voice note" : "📷 Photo")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplyMessage(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <HiXMark className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojis && (
        <div className="absolute bottom-full left-4 mb-2 p-3 bg-white dark:bg-[#1f2126] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700/80 z-50 w-72 sm:w-80 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Popular Emojis
            </span>
            <button
              type="button"
              onClick={() => setShowEmojis(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
            {POPULAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="text-xl p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-125 transition-all text-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GIF Picker Modal/Popover */}
      <GifPicker
        isOpen={showGifs}
        onClose={() => setShowGifs(false)}
        onSelect={handleSelectGif}
      />

      {/* Main input bar or Voice Recording Dock */}
      {isRecording ? (
        <div className="py-3 px-4 flex items-center justify-between gap-3 w-full animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="text-xs font-bold text-rose-500 tracking-wide uppercase">
              Recording
            </span>
            <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
              {formatTimer(recordingDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
              title="Cancel recording"
            >
              <HiTrash size={20} />
            </button>

            <button
              type="button"
              onClick={sendRecording}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-white font-semibold text-xs bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-md shadow-rose-500/20 active:scale-95 transition"
            >
              <HiPaperAirplane size={16} />
              <span>Send Voice Note</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="py-3 px-4 flex items-center gap-2 lg:gap-3 w-full">
          {/* Cloudinary upload */}
          <CldUploadButton
            options={{ maxFiles: 1 }}
            onUpload={handleUpload}
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
          >
            <div
              title="Attach image"
              className="p-2 rounded-xl text-slate-500 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition"
            >
              <HiPhoto size={24} />
            </div>
          </CldUploadButton>

          {/* GIF Picker button */}
          <button
            type="button"
            onClick={() => setShowGifs(!showGifs)}
            title="Send a GIF"
            className={`px-2 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider transition ${
              showGifs
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800"
            }`}
          >
            GIF
          </button>

          {/* Emoji trigger */}
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            title="Add emoji"
            className={`p-2 rounded-xl transition ${
              showEmojis
                ? "text-sky-500 bg-sky-50 dark:bg-slate-800"
                : "text-slate-500 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800"
            }`}
          >
            <HiFaceSmile size={24} />
          </button>

          {/* Microphone trigger for voice recording */}
          <button
            type="button"
            onClick={startRecording}
            title="Record voice note"
            className="p-2 rounded-xl text-slate-500 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition"
          >
            <HiMicrophone size={24} />
          </button>

          {/* Message Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex items-center gap-2 lg:gap-3 w-full"
          >
            <MessageInput
              id="message"
              register={register}
              errors={errors}
              required
              placeholder={
                replyMessage
                  ? `Reply to ${replyMessage.sender?.name || "message"}...`
                  : "Write a message in ConvoX..."
              }
            />
            <button
              type="submit"
              title="Send (Enter)"
              disabled={!currentMessage.trim()}
              className="
                rounded-xl 
                p-2.5 
                bg-gradient-to-r from-indigo-500 to-sky-500
                hover:from-indigo-600 hover:to-sky-600
                text-white
                shadow-sm shadow-sky-500/20
                cursor-pointer 
                transition-all
                duration-150
                hover:scale-105
                active:scale-95
                disabled:opacity-40
                disabled:cursor-not-allowed
                disabled:hover:scale-100
              "
            >
              <HiPaperAirplane size={18} className="translate-x-[-1px] translate-y-[-1px]" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Form;

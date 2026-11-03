import { create } from "zustand";
import { FullMessageType } from "../types";

interface OptimisticStore {
  pendingMessages: FullMessageType[];
  addPendingMessage: (message: FullMessageType) => void;
  updatePendingStatus: (tempId: string, status: "sending" | "sent" | "error") => void;
  removePendingMessage: (tempId: string) => void;
  clearPendingForConversation: (conversationId: string) => void;
}

const useOptimisticMessages = create<OptimisticStore>((set) => ({
  pendingMessages: [],
  addPendingMessage: (message) =>
    set((state) => ({
      pendingMessages: [
        ...state.pendingMessages.filter((m) => (m.tempId || m.id) !== (message.tempId || message.id)),
        message,
      ],
    })),
  updatePendingStatus: (tempId, status) =>
    set((state) => ({
      pendingMessages: state.pendingMessages.map((m) =>
        m.tempId === tempId || m.id === tempId ? { ...m, status } : m
      ),
    })),
  removePendingMessage: (tempId) =>
    set((state) => ({
      pendingMessages: state.pendingMessages.filter(
        (m) => m.tempId !== tempId && m.id !== tempId
      ),
    })),
  clearPendingForConversation: (conversationId) =>
    set((state) => ({
      pendingMessages: state.pendingMessages.filter((m) => m.conversationId !== conversationId),
    })),
}));

export default useOptimisticMessages;


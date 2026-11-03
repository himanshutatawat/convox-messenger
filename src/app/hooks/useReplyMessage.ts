import { create } from "zustand";
import { FullMessageType } from "../types";

interface ReplyMessageStore {
  replyMessage: FullMessageType | null;
  setReplyMessage: (message: FullMessageType | null) => void;
}

const useReplyMessage = create<ReplyMessageStore>((set) => ({
  replyMessage: null,
  setReplyMessage: (message) => set({ replyMessage: message }),
}));

export default useReplyMessage;


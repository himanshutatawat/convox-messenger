import PusherClient from "pusher-js";

export const pusherEvents = {
  NEW_MESSAGE: "messages:new",
  UPDATE_MESSAGE: "message:update",
  NEW_CONVERSATION: "conversation:new",
  UPDATE_CONVERSATION: "conversation:update",
  DELETE_CONVERSATION: "conversation:remove",
  MESSAGE_REACTION: "message:reaction",
  TYPING: "client-typing",
};

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
  channelAuthorization: {
    endpoint: "/api/pusher/auth",
    transport: "ajax",
  },
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

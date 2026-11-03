import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Members } from "pusher-js";

import { pusherClient } from "../libs/pusher";
import useActiveList from "./useActiveList";

const useActiveChannel = () => {
  const session = useSession();
  const { set, add, remove } = useActiveList();

  useEffect(() => {
    // Only subscribe to channel after user logs in
    if (session?.status !== "authenticated") {
      return;
    }

    const channel = pusherClient.subscribe("presence-messenger");

    const handleSubSucceeded = (members: Members) => {
      const initialMembers: string[] = [];
      members.each((member: Record<string, any>) => initialMembers.push(member.id));
      set(initialMembers);
    };

    const handleMemberAdded = (member: Record<string, any>) => {
      add(member.id);
    };

    const handleMemberRemoved = (member: Record<string, any>) => {
      remove(member.id);
    };

    channel.bind("pusher:subscription_succeeded", handleSubSucceeded);
    channel.bind("pusher:member_added", handleMemberAdded);
    channel.bind("pusher:member_removed", handleMemberRemoved);

    return () => {
      channel.unbind("pusher:subscription_succeeded", handleSubSucceeded);
      channel.unbind("pusher:member_added", handleMemberAdded);
      channel.unbind("pusher:member_removed", handleMemberRemoved);
      pusherClient.unsubscribe("presence-messenger");
    };
  }, [session?.status, set, add, remove]);
};

export default useActiveChannel;

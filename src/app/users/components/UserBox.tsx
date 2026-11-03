"use client";

import axios from "axios";
import { memo, useCallback, useState } from "react";
import { HiChatBubbleLeftEllipsis } from "react-icons/hi2";

import { User } from "@prisma/client";
import { useRouter } from "next/navigation";

import Avatar from "../../components/Avatar";
import LoadingModal from "../../components/modals/LoadingModal";

interface UserBoxProps {
  data: User;
}

const UserBox: React.FC<UserBoxProps> = ({ data }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(() => {
    setIsLoading(true);

    axios
      .post("/api/conversations", { userId: data.id })
      .then((res) => {
        router.push(`/conversations/${res.data.id}`);
      })
      .finally(() => setIsLoading(false));
  }, [data.id, router]);

  return (
    <>
      {isLoading && <LoadingModal />}
      <div
        onClick={handleClick}
        className="
          group
          w-full 
          relative 
          flex 
          items-center 
          justify-between
          p-3 
          rounded-2xl
          hover:bg-slate-100/80
          dark:hover:bg-slate-800/60
          transition-all
          duration-150
          cursor-pointer
        "
      >
        <div className="flex items-center space-x-3 min-w-0">
          <Avatar user={data} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {data.name}
            </p>
            {data.email && (
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{data.email}</p>
            )}
          </div>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
          <HiChatBubbleLeftEllipsis className="w-4 h-4" />
        </div>
      </div>
    </>
  );
};

export default memo(UserBox);

"use client";

import { User } from "@prisma/client";
import Image from "next/image";

import useActiveList from "../hooks/useActiveList";

interface AvatarProps {
  user?: User;
}

const Avatar: React.FC<AvatarProps> = ({ user }) => {
  const { members } = useActiveList();
  const isActive = members.indexOf(user?.email!) !== -1;

  return (
    <div className="relative h-9 w-9 md:h-11 md:w-11 flex-shrink-0">
      <div
        className="
        relative 
        inline-block 
        rounded-full 
        overflow-hidden
        h-9 
        w-9 
        md:h-11 
        md:w-11
        ring-2
        ring-slate-100
        dark:ring-slate-800
        shadow-sm
      "
      >
        <Image
          className="object-cover"
          fill
          src={user?.image || "/images/avatar-placeholder.png"}
          alt="Avatar"
        />
      </div>
      {isActive && (
        <span
          className="
            absolute 
            block 
            rounded-full 
            bg-emerald-500 
            ring-2 
            ring-white 
            top-0 
            right-0
            h-2.5 
            w-2.5 
            md:h-3.5 
            md:w-3.5
            shadow-sm
            dark:ring-slate-900
          "
        />
      )}
    </div>
  );
};

export default Avatar;

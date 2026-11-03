"use client";

import { memo } from "react";
import { User } from "@prisma/client";
import Image from "next/image";

import useActiveList from "../hooks/useActiveList";
import { optimizeCloudinaryUrl } from "../libs/cloudinaryUrl";

interface AvatarProps {
  user?: User;
}

const Avatar: React.FC<AvatarProps> = ({ user }) => {
  const isActive = useActiveList((state) =>
    user?.email ? state.members.includes(user.email) : false
  );

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
          sizes="(max-width: 768px) 36px, 44px"
          src={optimizeCloudinaryUrl(user?.image, 88)}
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
            md:h-3 
            md:w-3
            dark:ring-slate-900
          "
        />
      )}
    </div>
  );
};

export default memo(Avatar);

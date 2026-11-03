import React from "react";
import Image from "next/image";
import { HiArrowTopRightOnSquare } from "react-icons/hi2";
import { OGData } from "../types";

interface LinkPreviewProps {
  data: OGData;
  isOwn?: boolean;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ data, isOwn = false }) => {
  if (!data || (!data.title && !data.description && !data.image)) return null;

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        mt-2 
        block 
        rounded-2xl 
        overflow-hidden 
        border 
        transition-all 
        duration-150 
        hover:opacity-90 
        group 
        select-none 
        max-w-sm
        ${
          isOwn
            ? "bg-white/10 border-white/20 text-white"
            : "bg-white dark:bg-[#1a1c20] border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 shadow-sm"
        }
      `}
    >
      {/* Hero Image if available */}
      {data.image && (
        <div className="relative w-full h-36 bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <Image
            src={data.image}
            alt={data.title || "Link preview"}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            unoptimized
          />
        </div>
      )}

      {/* Meta Text */}
      <div className="p-3">
        {data.siteName && (
          <div
            className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${
              isOwn ? "text-white/70" : "text-sky-600 dark:text-sky-400"
            }`}
          >
            <span>{data.siteName}</span>
            <HiArrowTopRightOnSquare className="w-3 h-3 opacity-75" />
          </div>
        )}

        {data.title && (
          <h4 className="text-xs sm:text-sm font-bold line-clamp-2 leading-snug">
            {data.title}
          </h4>
        )}

        {data.description && (
          <p
            className={`mt-1 text-xs line-clamp-2 leading-relaxed ${
              isOwn ? "text-white/80" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {data.description}
          </p>
        )}
      </div>
    </a>
  );
};

export default LinkPreview;


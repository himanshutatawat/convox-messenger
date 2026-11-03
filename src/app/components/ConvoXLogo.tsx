import React from "react";

interface ConvoXLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const ConvoXLogo: React.FC<ConvoXLogoProps> = ({
  size = 40,
  showText = false,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-2xl shadow-lg transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3/5 h-3/5"
        >
          {/* Chat bubble with lightning / pulse wave */}
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          <path d="m13 8-4 5h4l-2 4" strokeWidth="2" fill="white" />
        </svg>
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
      </div>
      {showText && (
        <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-400 bg-clip-text text-transparent">
          Convo<span className="text-sky-500">X</span>
        </span>
      )}
    </div>
  );
};

export default ConvoXLogo;


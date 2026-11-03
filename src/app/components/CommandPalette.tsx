"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import {
  HiMagnifyingGlass,
  HiChatBubbleLeftRight,
  HiUsers,
  HiMoon,
  HiSun,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiArrowRightOnRectangle,
  HiXMark,
} from "react-icons/hi2";
import { sounds } from "../libs/soundEffects";

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen: controlledIsOpen, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const show = controlledIsOpen !== undefined ? controlledIsOpen : isOpen;

  const closePalette = React.useCallback(() => {
    if (onClose) onClose();
    setIsOpen(false);
    setSearch("");
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setSearch("");
      } else if (e.key === "Escape") {
        closePalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePalette]);

  if (!show) return null;

  const handleAction = (callback: () => void) => {
    callback();
    closePalette();
  };

  const toggleSound = () => {
    const next = !isMuted;
    sounds.setMuted(next);
    setIsMuted(next);
    if (!next) sounds.playPop();
  };

  const commands = [
    {
      id: "conversations",
      title: "Go to Messages",
      category: "Navigation",
      icon: HiChatBubbleLeftRight,
      action: () => router.push("/conversations"),
    },
    {
      id: "people",
      title: "Discover People & Start Chat",
      category: "Navigation",
      icon: HiUsers,
      action: () => router.push("/users"),
    },
    {
      id: "theme",
      title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      category: "Settings",
      icon: theme === "dark" ? HiSun : HiMoon,
      action: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
    {
      id: "sound",
      title: isMuted ? "Unmute Sound Cues" : "Mute Sound Cues",
      category: "Settings",
      icon: isMuted ? HiSpeakerWave : HiSpeakerXMark,
      action: toggleSound,
    },
    {
      id: "logout",
      title: "Sign Out",
      category: "Account",
      icon: HiArrowRightOnRectangle,
      action: () => signOut(),
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1c1d22] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <HiMagnifyingGlass className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or jump to..."
            className="w-full bg-transparent border-0 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-0 focus:outline-none"
          />
          <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md mr-2">
            ESC to close
          </span>
          <button
            type="button"
            onClick={closePalette}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Command List */}
        <div className="py-2 max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching commands found
            </div>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => handleAction(cmd.action)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-sky-50 group-hover:text-sky-600 dark:group-hover:bg-slate-700 dark:group-hover:text-sky-400 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {cmd.title}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {cmd.category}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-sky-500 transition">
                    Jump ↵
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">Ctrl+K</kbd> anywhere</span>
          <span className="font-semibold text-sky-500">ConvoX Command Palette</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;


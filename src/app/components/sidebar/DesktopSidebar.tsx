"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { User } from "@prisma/client";
import Link from "next/link";
import { HiCommandLine, HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";

import useRoutes from "../../hooks/useRoutes";
import ThemeToggle from "../theme/ThemeToggle";
import ConvoXLogo from "../ConvoXLogo";
import { sounds } from "../../libs/soundEffects";
import DesktopItem from "./DesktopItem";
import ProfileItem from "./ProfileItem";

const CommandPalette = dynamic(() => import("../CommandPalette"), { ssr: false });

interface DesktopSidebarProps {
  currentUser: User;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ currentUser }) => {
  const routes = useRoutes();
  const [showPalette, setShowPalette] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  const toggleSound = () => {
    const next = !isMuted;
    sounds.setMuted(next);
    setIsMuted(next);
    if (!next) sounds.playPop();
  };

  return (
    <>
      <CommandPalette isOpen={showPalette} onClose={() => setShowPalette(false)} />

      <div
        className="
        hidden 
        lg:fixed 
        lg:inset-y-0 
        lg:left-0 
        lg:z-40 
        lg:w-20 
        xl:px-4
        lg:overflow-y-auto 
        lg:bg-white/95 
        lg:backdrop-blur-md
        lg:border-r 
        lg:border-slate-200/80
        lg:pb-4
        lg:flex
        lg:flex-col
        justify-between
        dark:bg-[#16171a]/95
        dark:border-slate-800/80
        shadow-sm
      "
      >
        <div className="flex flex-col items-center">
          {/* Brand Header */}
          <Link
            href="/conversations"
            className="mt-4 mb-6 transition-transform hover:scale-105"
            title="ConvoX"
          >
            <ConvoXLogo size={42} showText={false} />
          </Link>

          {/* Navigation list */}
          <nav className="w-full">
            <ul role="list" className="flex flex-col items-center space-y-2">
              {routes.map((item) => (
                <DesktopItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={item.active}
                  onClick={item.onClick}
                />
              ))}

              {/* Command Palette Trigger */}
              <li className="w-full flex justify-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPalette(true)}
                  title="Command Palette (Ctrl+K)"
                  className="
                    p-3.5 
                    rounded-2xl 
                    text-slate-400 
                    hover:text-sky-500 
                    hover:bg-slate-100 
                    dark:hover:bg-slate-800 
                    hover:scale-105 
                    transition-all
                  "
                >
                  <HiCommandLine className="h-6 w-6" />
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <nav className="mt-4 flex flex-col justify-between items-center gap-3">
          {/* Audio toggle button */}
          <button
            type="button"
            onClick={toggleSound}
            title={isMuted ? "Sound muted (click to unmute)" : "Sound active (click to mute)"}
            className="
              p-2.5 
              rounded-xl 
              text-slate-400 
              hover:text-slate-700 
              dark:hover:text-slate-200 
              hover:bg-slate-100 
              dark:hover:bg-slate-800 
              transition
            "
          >
            {isMuted ? (
              <HiSpeakerXMark className="h-5 w-5 text-rose-400" />
            ) : (
              <HiSpeakerWave className="h-5 w-5 text-emerald-500" />
            )}
          </button>

          <ThemeToggle />
          <ProfileItem currentUser={currentUser} />
        </nav>
      </div>
    </>
  );
};

export default DesktopSidebar;

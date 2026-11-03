import Link from "next/link";
import { HiChatBubbleLeftRight, HiUsers, HiPhoto, HiBolt } from "react-icons/hi2";
import ConvoXLogo from "./ConvoXLogo";

const EmptyState = () => {
  return (
    <div
      className="
        relative
        px-6 
        py-12 
        h-full 
        flex 
        flex-col
        justify-center 
        items-center 
        bg-gradient-to-b from-slate-50 via-white to-slate-100
        dark:from-[#121316] dark:via-[#16171a] dark:to-[#121316]
        overflow-hidden
      "
    >
      {/* Decorative backdrop glow */}
      <div className="absolute w-96 h-96 bg-sky-500/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-md text-center items-center flex flex-col z-10">
        <div className="mb-6 p-4 rounded-3xl bg-white/80 dark:bg-slate-800/60 shadow-xl border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-sm">
          <ConvoXLogo size={64} showText={false} />
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Welcome to <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-400 bg-clip-text text-transparent">ConvoX</span>
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Select an active chat from the sidebar or start a fresh conversation with anyone on the platform.
        </p>

        {/* Action Button */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            href="/users"
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              bg-gradient-to-r from-indigo-500 to-sky-500
              hover:from-indigo-600 hover:to-sky-600
              shadow-md shadow-sky-500/20
              transition-all
              active:scale-95
            "
          >
            <HiUsers className="w-4 h-4" />
            Discover People
          </Link>
        </div>

        {/* Feature Highlights Pills */}
        <div className="mt-10 grid grid-cols-2 gap-3 w-full text-left">
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
              <HiBolt className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Real-Time Sync</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Instant messaging & seen status</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <HiChatBubbleLeftRight className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Group Channels</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Create multi-user group chats</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;

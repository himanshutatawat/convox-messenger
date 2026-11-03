import ConvoXLogo from "../components/ConvoXLogo";
import AuthForm from "./components/AuthForm";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#121316] overflow-hidden">
      {/* Decorative background glow circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-500/20 via-sky-500/20 to-teal-400/20 rounded-full blur-3xl pointer-events-none -z-10 dark:from-indigo-600/15 dark:via-sky-600/15 dark:to-teal-500/15" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex justify-center mb-4">
          <ConvoXLogo size={56} showText={true} />
        </div>
        <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Next-Gen Realtime Messenger
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Connect without limits
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Instant messaging, group chats, and real-time status.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthForm />
      </div>
    </div>
  );
}

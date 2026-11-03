import clsx from "clsx";

interface ButtonProps {
  type?: "button" | "submit" | "reset" | undefined;
  fullWidth?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  type = "button",
  fullWidth,
  children,
  onClick,
  secondary,
  danger,
  disabled,
}) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={clsx(
        `
        flex 
        items-center
        justify-center 
        gap-2
        rounded-xl 
        px-4 
        py-2.5 
        text-sm 
        font-semibold 
        shadow-sm
        transition-all
        duration-150
        active:scale-[0.98]
        focus-visible:outline 
        focus-visible:outline-2 
        focus-visible:outline-offset-2 
        `,
        disabled && "opacity-50 cursor-not-allowed active:scale-100",
        fullWidth && "w-full",
        secondary &&
        "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-700",
        danger &&
        "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20 focus-visible:outline-rose-600",
        !secondary &&
        !danger &&
        "bg-gradient-to-r from-indigo-500 via-sky-500 to-sky-600 hover:from-indigo-600 hover:to-sky-700 text-white shadow-sky-500/25 shadow-md focus-visible:outline-sky-500"
      )}
    >
      {children}
    </button>
  );
};

export default Button;

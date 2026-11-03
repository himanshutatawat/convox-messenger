import clsx from "clsx";
import Link from "next/link";

interface DesktopItemProps {
  label: string;
  icon: any;
  href: string;
  onClick?: () => void;
  active?: boolean;
}

const DesktopItem: React.FC<DesktopItemProps> = ({ label, href, icon: Icon, active, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      return onClick();
    }
  };

  return (
    <li onClick={handleClick} key={label} className="w-full flex justify-center">
      <Link
        href={href}
        title={label}
        className={clsx(
          `
            group 
            relative
            flex 
            items-center
            justify-center
            rounded-2xl 
            p-3.5
            transition-all
            duration-200
            hover:scale-105
          `,
          active
            ? "bg-gradient-to-tr from-indigo-500 to-sky-500 text-white shadow-md shadow-sky-500/25"
            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
        )}
      >
        <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </Link>
    </li>
  );
};

export default DesktopItem;

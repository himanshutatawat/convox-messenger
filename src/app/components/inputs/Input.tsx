"use client";

import clsx from "clsx";
import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";

interface InputProps {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors;
  disabled?: boolean;
  placeholder?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  id,
  register,
  required,
  errors,
  type = "text",
  disabled,
  placeholder,
}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium leading-6 text-slate-800 dark:text-slate-200"
      >
        {label}
      </label>
      <div className="mt-1.5">
        <input
          id={id}
          type={type}
          autoComplete={id}
          disabled={disabled}
          placeholder={placeholder}
          {...register(id, { required })}
          className={clsx(
            `
            form-input
            block 
            w-full 
            rounded-xl 
            border-0 
            py-2.5 
            px-3.5
            text-slate-900 
            shadow-sm 
            ring-1 
            ring-inset 
            ring-slate-300 
            placeholder:text-slate-400 
            focus:ring-2 
            focus:ring-inset 
            focus:ring-sky-500 
            sm:text-sm 
            sm:leading-6
            transition-all
            duration-150
            bg-white/80
            dark:bg-[#202227]
            dark:ring-slate-700
            dark:text-white
            dark:placeholder:text-slate-500`,
            errors[id] && "ring-rose-500 focus:ring-rose-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>
    </div>
  );
};

export default Input;

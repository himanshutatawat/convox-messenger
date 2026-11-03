"use client";

import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";

interface MessageInputProps {
  placeholder?: string;
  id: string;
  type?: string;
  required?: boolean;
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors;
}

const MessageInput: React.FC<MessageInputProps> = ({
  placeholder,
  id,
  type,
  required,
  register,
}) => {
  return (
    <div className="relative w-full">
      <input
        id={id}
        type={type}
        autoComplete="off"
        {...register(id, { required })}
        placeholder={placeholder}
        className="
          w-full 
          py-2.5 
          px-4 
          text-sm
          rounded-xl 
          bg-slate-100/90 
          border-0 
          text-slate-900 
          placeholder-slate-400 
          focus:ring-2 
          focus:ring-sky-500 
          transition-all
          dark:bg-slate-800/80 
          dark:text-slate-100 
          dark:placeholder-slate-500
        "
      />
    </div>
  );
};

export default MessageInput;

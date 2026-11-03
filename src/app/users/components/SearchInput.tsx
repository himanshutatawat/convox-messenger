"use client";

import { ChangeEvent, Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";

interface SearchInputProps {
  placeholder?: string;
  id: string;
  setSearchBy: Dispatch<SetStateAction<string>>;
}

const SearchInput: React.FC<SearchInputProps> = ({ placeholder, id, setSearchBy }) => {
  const [val, setVal] = useState("");

  const debouncedSearch = useRef(
    debounce(async (criteria) => {
      setSearchBy(criteria);
    }, 250)
  ).current;

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setVal(text);
    debouncedSearch(text);
  };

  const handleClear = () => {
    setVal("");
    setSearchBy("");
  };

  return (
    <div className="relative mb-3">
      <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
      <input
        id={id}
        value={val}
        autoComplete={id}
        placeholder={placeholder}
        onChange={handleSearch}
        className="
          w-full 
          pl-9 
          pr-8 
          py-2 
          text-sm 
          rounded-xl 
          bg-slate-100/90 
          border-0 
          text-slate-800 
          placeholder-slate-400 
          focus:ring-2 
          focus:ring-sky-500 
          transition-all
          dark:bg-slate-800/80 
          dark:text-slate-100 
          dark:placeholder-slate-500
        "
      />
      {val && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <HiXMark className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;

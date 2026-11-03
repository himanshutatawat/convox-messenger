"use client";

import { useState } from "react";
import { User } from "@prisma/client";

import SearchInput from "./SearchInput";
import UserBox from "./UserBox";

interface UserListProps {
  items: User[];
}

const UserList: React.FC<UserListProps> = ({ items }) => {
  const [searchBy, setSearchBy] = useState("");

  const filterBySearch = (user: User) => {
    if (searchBy) {
      const lowerCaseSearch = searchBy.toLocaleLowerCase();
      const email = user.email || "";
      const name = user.name || "";
      return email.includes(lowerCaseSearch) || name.includes(lowerCaseSearch);
    }
    return true;
  };

  const filteredItems = items.filter(filterBySearch);

  return (
    <aside
      className="
        fixed 
        inset-y-0 
        pb-20
        lg:pb-0
        lg:left-20 
        lg:w-80 
        lg:block
        overflow-y-auto 
        border-r 
        border-slate-200/80
        block w-full left-0
        bg-white/95
        backdrop-blur-sm
        dark:bg-[#16171a]/95
        dark:border-slate-800/80
      "
    >
      <div className="px-5">
        <div className="flex items-center justify-between pt-5 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              People
            </h2>
            {items.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {items.length}
              </span>
            )}
          </div>
        </div>

        <SearchInput
          id="search"
          placeholder="Search by name or email..."
          setSearchBy={setSearchBy}
        />

        <div className="space-y-1">
          {filteredItems.map((item) => (
            <UserBox key={item.id} data={item} />
          ))}

          {searchBy && filteredItems.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No contacts found matching &ldquo;{searchBy}&rdquo;
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default UserList;

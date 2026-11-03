"use client";

import React, { useState } from "react";
import Image from "next/image";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";

interface GifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (gifUrl: string) => void;
}

const CATEGORIES = ["Trending", "Reaction", "Laugh", "Love", "Celebrate", "Shocked", "Dance"];

const CURATED_GIFS: { [category: string]: string[] } = {
  Trending: [
    "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
    "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif",
    "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
    "https://media.giphy.com/media/11ISwbgGL28Zjq/giphy.gif",
    "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif",
  ],
  Reaction: [
    "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
    "https://media.giphy.com/media/10yXFkBJ0MwGQg/giphy.gif",
    "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif",
    "https://media.giphy.com/media/PUBxelpjgh5ry/giphy.gif",
  ],
  Laugh: [
    "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif",
    "https://media.giphy.com/media/CoDp6NnSmItoY/giphy.gif",
    "https://media.giphy.com/media/143qWPF33EtajK/giphy.gif",
  ],
  Love: [
    "https://media.giphy.com/media/26BRv0ThflsDTqUXa/giphy.gif",
    "https://media.giphy.com/media/l4pTdcifPZLpDjL1e/giphy.gif",
    "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif",
  ],
  Celebrate: [
    "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
    "https://media.giphy.com/media/g9582DNuQppxC/giphy.gif",
    "https://media.giphy.com/media/3KC2jD2Q38OSY/giphy.gif",
  ],
  Shocked: [
    "https://media.giphy.com/media/tfUW8mhiFk8NlJhgEh/giphy.gif",
    "https://media.giphy.com/media/6nWhy3ulBL7GSCvKw6/giphy.gif",
    "https://media.giphy.com/media/1L5YuA6wpKkNO/giphy.gif",
  ],
  Dance: [
    "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
    "https://media.giphy.com/media/14qb1Uhf40ndw4/giphy.gif",
    "https://media.giphy.com/media/mKMGLhoD8L4yc/giphy.gif",
  ],
};

export const GifPicker: React.FC<GifPickerProps> = ({ isOpen, onClose, onSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState("Trending");
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const currentGifs = CURATED_GIFS[selectedCategory] || CURATED_GIFS["Trending"];

  return (
    <div className="absolute bottom-full left-4 mb-2 p-3 bg-white dark:bg-[#1c1e22] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 z-50 w-80 sm:w-96 animate-in fade-in slide-in-from-bottom-2 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-extrabold text-[10px]">
            GIF
          </span>
          Choose a GIF
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
        >
          <HiXMark className="w-4 h-4" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-sky-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GIF Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
        {currentGifs.map((url, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSelect(url);
              onClose();
            }}
            className="relative h-24 rounded-xl overflow-hidden group hover:opacity-90 active:scale-95 transition-all border border-slate-200/50 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800"
          >
            <Image
              src={url}
              alt="GIF"
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              unoptimized
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default GifPicker;


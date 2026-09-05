"use client";

import React, { useState } from "react";
import { Search, Zap, Loader2 } from "lucide-react";

interface HeaderProps {
  onSearch: (gameName: string, tagLine: string) => void;
  isLoading?: boolean;
  initialQuery?: string;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, isLoading, initialQuery = "Sunny9#hono" }) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = query.trim().split("#");
    if (parts.length >= 2) {
      onSearch(parts[0].trim(), parts[1].trim());
    } else if (parts.length === 1 && parts[0]) {
      // タグがない場合はデフォルトJP1
      onSearch(parts[0].trim(), "JP1");
    }
  };

  return (
    <header className="bg-white border-b border-[#dadce0] sticky top-0 z-30 px-6 py-3 shadow-[0_1px_2px_rgba(60,64,67,0.08)]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white font-bold text-base shadow-sm">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-[#202124]">
              LoL<span className="text-[#1a73e8]">RankupLab</span>
            </span>
            <span className="ml-2 text-xs bg-[#e8f0fe] text-[#1a73e8] font-medium px-2 py-0.5 rounded-full">
              SoloQ Optimizer
            </span>
          </div>
        </div>

        {/* Google-like Search Bar */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-xl">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="サモナー名#タグライン を入力 (例: Sunny9#hono, Faker#KR1)"
              disabled={isLoading}
              className="w-full pl-11 pr-24 py-2.5 bg-[#f1f3f4] hover:bg-[#e8eaed] focus:bg-white text-sm text-[#202124] rounded-full border border-transparent focus:border-[#dadce0] focus:shadow-[0_1px_6px_rgba(32,33,36,0.28)] transition-all outline-none disabled:opacity-50"
            />
            <div className="absolute left-3.5 text-[#5f6368]">
              <Search className="w-4 h-4" />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-1.5 px-4 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium rounded-full shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>検索</span>
            </button>
          </div>
        </form>

        {/* Status Indicator */}
        <div className="flex items-center gap-3 text-xs text-[#5f6368]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Rails GraphQL Online
          </span>
        </div>

      </div>
    </header>
  );
};

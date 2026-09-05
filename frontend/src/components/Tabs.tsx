"use client";

import React from "react";
import { Swords, ListFilter, BarChart3 } from "lucide-react";

export type TabType = "matchups" | "gap" | "matches";

interface TabsProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, onChange }) => {
  return (
    <div className="border-b border-[#dadce0] flex gap-8">
      <button
        onClick={() => onChange("matchups")}
        className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition ${
          activeTab === "matchups"
            ? "border-[#1a73e8] text-[#1a73e8]"
            : "border-transparent text-[#5f6368] hover:text-[#202124]"
        }`}
      >
        <Swords className="w-4 h-4" />
        Matchup Lab
      </button>

      <button
        onClick={() => onChange("gap")}
        className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition ${
          activeTab === "gap"
            ? "border-[#1a73e8] text-[#1a73e8]"
            : "border-transparent text-[#5f6368] hover:text-[#202124]"
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        Performance & Gap
        <span className="text-[10px] bg-[#e8f0fe] text-[#1967d2] px-1.5 py-0.2 rounded font-bold">
          New
        </span>
      </button>

      <button
        onClick={() => onChange("matches")}
        className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition ${
          activeTab === "matches"
            ? "border-[#1a73e8] text-[#1a73e8]"
            : "border-transparent text-[#5f6368] hover:text-[#202124]"
        }`}
      >
        <ListFilter className="w-4 h-4" />
        Match History
      </button>
    </div>
  );
};

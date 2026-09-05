"use client";

import React, { useState } from "react";
import { MatchParticipant } from "@/types/graphql";
import { MatchCard } from "./MatchCard";

interface MatchListProps {
  participants: MatchParticipant[];
  onEditNote: (participant: MatchParticipant) => void;
}

const PAGE_SIZE = 15;

export const MatchList: React.FC<MatchListProps> = ({ participants, onEditNote }) => {
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (participants.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#dadce0] p-12 text-center text-[#5f6368] space-y-2">
        <p className="font-semibold text-base text-[#202124]">試合データが見つかりません</p>
        <p className="text-xs">Riot APIから試合履歴を同期するか、サモナー名を再検索してください。</p>
      </div>
    );
  }

  const visibleParticipants = participants.slice(0, visibleCount);
  const hasMore = visibleCount < participants.length;

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-[#5f6368] px-2 font-medium">
        <span>
          直近 {participants.length} 試合中 {visibleParticipants.length} 試合を表示
        </span>
        <span>CLASSIC (サモナーズリフト)</span>
      </div>

      <div className="space-y-3">
        {visibleParticipants.map((participant) => (
          <MatchCard
            key={participant.id}
            participant={participant}
            onEditNote={onEditNote}
            isExpanded={expandedId === participant.id}
            onToggle={() => handleToggleExpand(participant.id)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="px-6 py-2.5 bg-white hover:bg-[#f8f9fa] text-[#1a73e8] hover:text-[#1557b0] font-bold text-xs rounded-xl border border-[#dadce0] hover:border-[#1a73e8]/40 shadow-2xs transition cursor-pointer"
          >
            さらに15試合を表示 (残り {participants.length - visibleCount} 試合)
          </button>
        </div>
      )}
    </div>
  );
};

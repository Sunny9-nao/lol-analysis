"use client";

import React, { useState } from "react";
import { MatchParticipant } from "@/types/graphql";
import { MatchCard } from "./MatchCard";
import { History, Loader2 } from "lucide-react";

interface MatchListProps {
  participants: MatchParticipant[];
  onEditNote: (participant: MatchParticipant) => void;
  onSelectMatch?: (participant: MatchParticipant) => void;
  onBackfillMatches?: () => void;
  isBackfilling?: boolean;
}

const PAGE_SIZE = 15;

export const MatchList: React.FC<MatchListProps> = ({
  participants,
  onEditNote,
  onSelectMatch,
  onBackfillMatches,
  isBackfilling = false,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (participants.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#dadce0] p-12 text-center text-[#5f6368] space-y-4">
        <div className="space-y-1">
          <p className="font-semibold text-base text-[#202124]">試合データが見つかりません</p>
          <p className="text-xs">Riot APIから試合履歴を同期するか、サモナー名を再検索してください。</p>
        </div>
        {onBackfillMatches && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onBackfillMatches}
              disabled={isBackfilling}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-xl transition shadow-2xs disabled:opacity-60 cursor-pointer"
            >
              {isBackfilling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>過去の試合を取得中...</span>
                </>
              ) : (
                <>
                  <History className="w-4 h-4 text-white" />
                  <span>試合データを取得 (+30試合)</span>
                </>
              )}
            </button>
          </div>
        )}
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
      </div>

      <div className="space-y-3">
        {visibleParticipants.map((participant) => (
          <MatchCard
            key={participant.id}
            participant={participant}
            onEditNote={onEditNote}
            onSelectMatch={onSelectMatch}
            isExpanded={expandedId === participant.id}
            onToggle={() => handleToggleExpand(participant.id)}
          />
        ))}
      </div>

      <div className="pt-2 flex flex-col items-center gap-3">
        {hasMore && (
          <button
            type="button"
            onClick={handleLoadMore}
            className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-[#f8f9fa] text-[#1a73e8] hover:text-[#1557b0] font-bold text-xs rounded-xl border border-[#dadce0] hover:border-[#1a73e8]/40 shadow-2xs transition cursor-pointer"
          >
            さらに15試合を表示 (残り {participants.length - visibleCount} 試合)
          </button>
        )}

        {onBackfillMatches && (
          <div className="w-full bg-white rounded-2xl border border-[#dadce0] p-4 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <p className="text-xs font-bold text-[#202124]">
                  過去のSoloQ試合を追加同期
                </p>
                <p className="text-[11px] text-[#5f6368]">
                  Riot APIから未取得の過去試合を30件ずつ遡って読み込み、対面分析に蓄積します
                </p>
              </div>
              <button
                type="button"
                onClick={onBackfillMatches}
                disabled={isBackfilling}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#f8f9fa] hover:bg-[#e8f0fe] text-[#1a73e8] hover:text-[#1557b0] text-xs font-bold rounded-xl border border-[#dadce0] hover:border-[#1a73e8]/40 shadow-2xs transition disabled:opacity-60 cursor-pointer shrink-0"
              >
                {isBackfilling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#1a73e8]" />
                    <span>過去試合を取得中...</span>
                  </>
                ) : (
                  <>
                    <History className="w-4 h-4 text-[#1a73e8]" />
                    <span>過去の試合を同期 (+30試合)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

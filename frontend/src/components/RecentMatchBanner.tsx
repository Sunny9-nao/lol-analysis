"use client";

import React from "react";
import Image from "next/image";
import { MatchParticipant } from "@/types/graphql";
import { Edit3, CheckCircle2, Clock, AlertCircle, BarChart2 } from "lucide-react";
import { formatMatchTime } from "@/lib/format";

interface RecentMatchBannerProps {
  latestParticipant?: MatchParticipant | null;
  onEditNote: (participant: MatchParticipant) => void;
  onSelectMatch?: (participant: MatchParticipant) => void;
}

export const RecentMatchBanner: React.FC<RecentMatchBannerProps> = ({
  latestParticipant,
  onEditNote,
  onSelectMatch,
}) => {
  if (!latestParticipant) return null;

  const isWin = latestParticipant.win;
  const note = latestParticipant.matchNote;
  const hasNote = Boolean(note?.content && note.content.trim().length > 0);
  const timeInfo = formatMatchTime(latestParticipant.gameCreation);

  const defaultChampImg = "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Jax.png";
  const myChampImg = latestParticipant.champion?.imageUrl || defaultChampImg;
  const oppChampImg = latestParticipant.opponentChampion?.imageUrl;
  const myChampName = latestParticipant.champion?.name || latestParticipant.championName;
  const oppChampName = latestParticipant.opponentChampion?.name || latestParticipant.opponentChampionName || "対面";

  const mainItems = (latestParticipant.items || []).slice(0, 6);
  const trinketItem = latestParticipant.items && latestParticipant.items.length > 6 ? latestParticipant.items[6] : 0;

  return (
    <div
      className={`rounded-xl border p-4 transition shadow-2xs ${
        !hasNote
          ? "bg-white border-[#d2e3fc] shadow-xs"
          : "bg-white border-[#dadce0]"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Match Context */}
        <div className="flex items-center gap-4">
          <div
            className={`w-1.5 h-12 rounded-full shrink-0 ${
              isWin ? "bg-[#1a73e8]" : "bg-[#d93025]"
            }`}
          />

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-bold text-[#5f6368] uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#1a73e8]" />
                直前のソロランク試合
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.2 rounded ${
                  isWin
                    ? "bg-[#e8f0fe] text-[#1967d2]"
                    : "bg-[#fce8e6] text-[#c5221f]"
                }`}
              >
                {isWin ? "勝利" : "敗北"}
              </span>
              <span className="text-xs text-[#5f6368]">
                {latestParticipant.formattedDuration}
              </span>
              {timeInfo.relative && (
                <span className="text-xs text-[#80868b]">
                  • {timeInfo.relative} ({timeInfo.absolute})
                </span>
              )}
            </div>

            {/* Champion vs Opponent, Stats, and Items */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Image
                  src={myChampImg}
                  alt={myChampName}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded object-cover border border-[#dadce0]"
                />
                <span className="font-bold text-[#202124]">{myChampName}</span>
                <span className="text-[#80868b] font-medium text-xs">vs</span>
                {oppChampImg ? (
                  <Image
                    src={oppChampImg}
                    alt={oppChampName}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded object-cover border border-[#dadce0]"
                  />
                ) : null}
                <span className="font-bold text-[#202124]">{oppChampName}</span>
              </div>

              <span className="text-[#80868b]">•</span>

              <span className="text-[#5f6368]">
                KDA: <strong className="text-[#202124]">{latestParticipant.kills}/{latestParticipant.deaths}/{latestParticipant.assists}</strong>
              </span>
              <span className="text-[#5f6368]">
                CS: <strong className="text-[#202124]">{latestParticipant.cs}</strong>
              </span>

              <span className="text-[#80868b]">•</span>

              {/* Items Slot */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-[#5f6368] mr-0.5">最終ビルド:</span>
                {Array.from({ length: 6 }).map((_, idx) => {
                  const itemId = mainItems[idx] || 0;
                  return itemId > 0 ? (
                    <img
                      key={idx}
                      src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${itemId}.png`}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      className="w-[22px] h-[22px] rounded bg-[#202124] border border-[#3c4043] object-cover"
                      title={`Item ${itemId}`}
                    />
                  ) : (
                    <div
                      key={idx}
                      className="w-[22px] h-[22px] rounded bg-[#f1f3f4] border border-[#dadce0]"
                    />
                  );
                })}
                {trinketItem > 0 ? (
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${trinketItem}.png`}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="w-[22px] h-[22px] rounded-full bg-[#202124] border border-[#3c4043] object-cover ml-0.5"
                    title={`Trinket ${trinketItem}`}
                  />
                ) : (
                  <div className="w-[22px] h-[22px] rounded-full bg-[#f1f3f4] border border-[#dadce0] ml-0.5" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Note Action / Status */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {onSelectMatch && (
            <button
              type="button"
              data-testid="recent-match-detail-btn"
              onClick={() => onSelectMatch(latestParticipant)}
              className="text-xs font-bold text-[#3c4043] hover:text-[#1a73e8] bg-[#f8f9fa] hover:bg-[#e8f0fe] px-3 py-1.5 rounded-lg border border-[#dadce0] hover:border-[#d2e3fc] transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#1a73e8]" />
              詳細を見る
            </button>
          )}

          {hasNote ? (
            <div className="flex items-center gap-3">
              <div className="text-right max-w-xs md:max-w-sm hidden sm:block">
                <span className="text-[11px] font-bold text-[#137333] flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> メモ記録済み
                  {note?.matchupTag && (
                    <span className="text-[10px] bg-[#f1f3f4] text-[#3c4043] px-1.5 py-0.2 rounded font-semibold ml-1">
                      {note.matchupTag}
                    </span>
                  )}
                </span>
                <p className="text-xs text-[#3c4043] truncate italic mt-0.5">
                  &ldquo;{note?.content}&rdquo;
                </p>
              </div>
              <button
                onClick={() => onEditNote(latestParticipant)}
                className="text-xs font-semibold text-[#1a73e8] hover:bg-[#e8f0fe] px-3 py-1.5 rounded-lg border border-[#dadce0] hover:border-[#1a73e8] transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                メモを編集
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs text-[#b06000] font-medium bg-[#fef7e0] border border-[#fce8b2] px-2.5 py-1 rounded flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                メモ未記入
              </span>
              <button
                onClick={() => onEditNote(latestParticipant)}
                className="text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] px-4 py-2 rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                メモを記録
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

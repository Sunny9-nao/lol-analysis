"use client";

import React from "react";
import Image from "next/image";
import { Summoner } from "@/types/graphql";
import { RefreshCw } from "lucide-react";

interface SummonerProfileProps {
  summoner: Summoner;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const SummonerProfile: React.FC<SummonerProfileProps> = ({
  summoner,
  onRefresh,
  isRefreshing,
}) => {
  const participants = summoner.matchParticipants || [];
  const noteCount = participants.filter((p) => p.matchNote?.content).length;
  const iconUrl =
    summoner.profileIconUrl ||
    "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/29.png";

  return (
    <div className="bg-white rounded-2xl border border-[#dadce0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        {/* Profile Icon */}
        <div className="relative w-16 h-16 shrink-0">
          <Image
            src={iconUrl}
            alt={summoner.gameName}
            width={64}
            height={64}
            className="w-16 h-16 rounded-2xl border-2 border-[#e8eaed] object-cover shadow-sm"
          />
          {summoner.summonerLevel && (
            <span className="absolute -bottom-2 -right-1 bg-[#202124] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
              Lv.{summoner.summonerLevel}
            </span>
          )}
        </div>

        {/* Summoner Info */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#202124] tracking-tight">
              {summoner.gameName}
            </h1>
            <span className="text-sm font-medium text-[#5f6368] bg-[#f1f3f4] px-2 py-0.5 rounded-md">
              #{summoner.tagLine}
            </span>
          </div>
          <p className="text-xs text-[#5f6368] mt-1 flex items-center gap-2">
            <span>
              {summoner.lastSyncedAt
                ? `最終同期: ${new Date(summoner.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : "未同期"}
            </span>
            <span>•</span>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-[#1a73e8] hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
              最新データを再取得
            </button>
          </p>
        </div>
      </div>

      {/* Quick Stats Pills */}
      <div className="flex items-center gap-3">
        <div className="bg-[#f8f9fa] border border-[#e8eaed] rounded-xl px-4 py-3 text-center min-w-[100px]">
          <span className="text-[11px] font-medium text-[#5f6368] block">記録試合数</span>
          <span className="text-lg font-bold text-[#202124]">
            {participants.length} 試合
          </span>
        </div>
        <div className="bg-[#e8f0fe] border border-[#d2e3fc] rounded-xl px-4 py-3 text-center min-w-[110px]">
          <span className="text-[11px] font-medium text-[#1a73e8] block">直近勝率</span>
          <span className="text-lg font-bold text-[#1a73e8]">
            {summoner.recentWinRate != null ? `${summoner.recentWinRate}%` : "-"}
          </span>
        </div>
        <div className="bg-[#f8f9fa] border border-[#e8eaed] rounded-xl px-4 py-3 text-center min-w-[100px]">
          <span className="text-[11px] font-medium text-[#5f6368] block">記録メモ</span>
          <span className="text-lg font-bold text-[#202124]">{noteCount} 件</span>
        </div>
      </div>
    </div>
  );
};

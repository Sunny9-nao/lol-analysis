import React, { useState } from "react";
import Image from "next/image";
import { MatchParticipant } from "@/types/graphql";
import { Edit3, ChevronDown, ChevronUp, ChevronRight, Clock, ArrowRight } from "lucide-react";
import { formatMatchTime, groupEarlyItems } from "@/lib/format";
import { MatchTimelineGraph } from "./MatchTimelineGraph";

interface MatchCardProps {
  participant: MatchParticipant;
  onEditNote: (participant: MatchParticipant) => void;
  onSelectMatch?: (participant: MatchParticipant) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const SPELL_IMG_MAP: Record<number, string> = {
  4: "SummonerFlash",
  12: "SummonerTeleport",
  14: "SummonerDot",
  11: "SummonerSmite",
  6: "SummonerHaste",
  3: "SummonerExhaust",
  7: "SummonerHeal",
  21: "SummonerBarrier",
};

export const MatchCard: React.FC<MatchCardProps> = ({
  participant,
  onEditNote,
  onSelectMatch,
  isExpanded = false,
  onToggle,
}) => {
  const [itemTimelineMode, setItemTimelineMode] = useState<"early" | "full">("full");
  const isWin = participant.win;
  const note = participant.matchNote;

  const defaultChampImg = "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Jax.png";
  const myChampImg = participant.champion?.imageUrl || defaultChampImg;
  const oppChampImg = participant.opponentChampion?.imageUrl;
  const timeInfo = formatMatchTime(participant.gameCreation);

  const mainItems = (participant.items || []).slice(0, 6);
  const trinket = (participant.items || [])[6];

  const rawTimelineItems =
    itemTimelineMode === "early"
      ? participant.earlyItems || []
      : participant.itemTimeline && participant.itemTimeline.length > 0
      ? participant.itemTimeline
      : participant.earlyItems || [];
  const itemGroups = groupEarlyItems(rawTimelineItems);


  return (
    <div
      data-testid="match-card"
      className={`bg-white rounded-xl border transition shadow-2xs overflow-hidden ${
        isExpanded ? "border-[#1a73e8]/60 shadow-xs" : "border-[#dadce0] hover:border-[#1a73e8]/40"
      }`}
    >
      {/* Clickable Header Row */}
      <div
        data-testid="match-card-header"
        onClick={() => {
          if (onSelectMatch) {
            onSelectMatch(participant);
          } else if (onToggle) {
            onToggle();
          }
        }}
        className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer select-none"
      >
      {/* 1. Result Indicator & Date */}
      <div className="flex items-center gap-2.5 w-full sm:w-32 lg:w-32 shrink-0">
        <div className={`w-1.5 h-11 rounded-full shrink-0 ${isWin ? "bg-[#1a73e8]" : "bg-[#d93025]"}`} />
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`font-bold text-sm ${isWin ? "text-[#1967d2]" : "text-[#c5221f]"}`}>
              {isWin ? "勝利" : "敗北"}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#f1f3f4] text-[#3c4043]">
              {participant.queueName || "Solo/Duo"}
            </span>
          </div>
          {timeInfo.relative && (
            <div className="text-[11px] text-[#5f6368] mt-0.5 whitespace-nowrap">
              <span className="font-semibold text-[#202124]">{timeInfo.relative}</span> ({timeInfo.absolute})
            </div>
          )}
          <span className="text-[10px] text-[#80868b] block">{participant.formattedDuration}</span>
        </div>
      </div>

      {/* 2. Matchup Champion & Spells */}
      <div className="flex items-center gap-2 w-full sm:w-52 lg:w-56 shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <Image
            src={myChampImg}
            alt={participant.championName}
            width={38}
            height={38}
            className="w-9 h-9 rounded-lg object-cover border border-[#dadce0]"
          />
          {participant.spells && participant.spells.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {participant.spells.slice(0, 2).map((spellId, idx) => {
                const spellName = SPELL_IMG_MAP[spellId] || "SummonerFlash";
                return (
                  <img
                    key={idx}
                    src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/spell/${spellName}.png`}
                    alt=""
                    className="w-4 h-4 rounded"
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="min-w-0 shrink-0">
          <span className="font-bold text-xs text-[#202124] whitespace-nowrap block">
            {participant.champion?.name || participant.championName}
          </span>
          <span className="text-[10px] text-[#5f6368] font-medium block">
            {participant.position || "TOP"}
          </span>
        </div>

        <span className="text-xs text-[#80868b] font-medium mx-1 shrink-0">vs</span>

        {participant.opponentChampionName ? (
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            {oppChampImg ? (
              <Image
                src={oppChampImg}
                alt={participant.opponentChampionName}
                width={36}
                height={36}
                className="w-9 h-9 rounded-lg object-cover border border-[#dadce0] shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#f1f3f4] border border-[#dadce0] flex items-center justify-center text-[10px] text-[#5f6368] font-bold shrink-0">
                {participant.opponentChampionName.slice(0, 3)}
              </div>
            )}
            <div className="min-w-0">
              <span className="font-bold text-xs text-[#202124] whitespace-nowrap block">
                {participant.opponentChampion?.name || participant.opponentChampionName}
              </span>
              <span className="text-[10px] text-[#5f6368] block">対面</span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-[#5f6368] italic shrink-0">対面なし</span>
        )}
      </div>

      {/* 3. Score, CS & Gold */}
      <div className="text-center text-xs w-full sm:w-28 lg:w-32 shrink-0">
        <span className="font-bold text-sm text-[#202124] block">
          {participant.kills} / {participant.deaths} / {participant.assists}
        </span>
        <span
          className={`text-[11px] font-semibold block ${
            participant.kdaRatio >= 3 ? "text-[#1967d2]" : "text-[#5f6368]"
          }`}
        >
          {participant.kdaRatio} KDA
        </span>
        <div className="flex items-center justify-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[10px] text-[#5f6368] whitespace-nowrap">
            {participant.cs} CS {participant.goldEarned ? `• ${(participant.goldEarned / 1000).toFixed(1)}k G` : ""}
          </span>
          {participant.goldDiffAt14 != null && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded whitespace-nowrap ${
                participant.goldDiffAt14 >= 500
                  ? "bg-[#e6f4ea] text-[#137333] border border-[#b7e1cd]"
                  : participant.goldDiffAt14 <= -500
                  ? "bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]"
                  : "bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]"
              }`}
            >
              GD14: {participant.goldDiffAt14 > 0 ? `+${participant.goldDiffAt14}` : participant.goldDiffAt14}
            </span>
          )}
        </div>
      </div>

      {/* 4. Final Build */}
      <div className="flex items-center justify-center gap-1 w-full sm:w-44 lg:w-44 shrink-0">
        <div className="flex items-center gap-1">
          {Array.from({ length: 6 }).map((_, idx) => {
            const itemId = mainItems[idx] || 0;
            return (
              <div
                key={idx}
                className="w-6 h-6 rounded bg-[#202124] border border-[#dadce0] overflow-hidden shrink-0"
              >
                {itemId > 0 ? (
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${itemId}.png`}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#f1f3f4]" />
                )}
              </div>
            );
          })}
        </div>
        {/* Trinket */}
        <div className="w-6 h-6 rounded-full bg-[#202124] border border-[#dadce0] overflow-hidden ml-1 shrink-0">
          {trinket && trinket > 0 ? (
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${trinket}.png`}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#f1f3f4]" />
          )}
        </div>
      </div>

      {/* 5. Note Snippet / Edit Button: 残り領域を綺麗に満たしはみ出さない */}
      <div className="flex-1 min-w-0 max-w-xs xl:max-w-sm h-11 bg-[#f8f9fa] border border-[#dadce0] rounded-lg px-3 py-2 text-xs text-[#3c4043] flex items-center justify-between gap-2">
        <div className="truncate flex-1 min-w-0">
          {note?.content ? (
            <div className="flex items-center gap-1.5 truncate">
              {note.matchupTag && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                    note.matchupTag === "Hard"
                      ? "bg-[#fef7e0] text-[#b06000] border border-[#fce8b2]"
                      : note.matchupTag === "Easy"
                      ? "bg-[#e6f4ea] text-[#137333] border border-[#b7e1cd]"
                      : "bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]"
                  }`}
                >
                  {note.matchupTag}
                </span>
              )}
              <span className="truncate text-[#202124] text-[11px]">{note.content}</span>
            </div>
          ) : (
            <span className="text-[#80868b] italic text-[11px]">（メモなし）</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditNote(participant);
          }}
          className="text-[#1a73e8] hover:text-[#1557b0] text-[11px] font-bold hover:underline shrink-0 flex items-center gap-1 cursor-pointer pl-1"
        >
          <Edit3 className="w-3 h-3" />
          {note?.content ? "編集" : "追加"}
        </button>
      </div>

      {/* Detail Indicator / Expand Toggle */}
      <div className="hidden lg:flex items-center text-[#5f6368] hover:text-[#1a73e8] transition shrink-0">
        {onSelectMatch ? (
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] px-2.5 py-1 rounded-md transition">
            <span>詳細</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        ) : isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[#1a73e8]" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </div>
    </div>

    {/* Detail Accordion Panel */}
    {isExpanded && (
      <div
        data-testid="match-accordion-panel"
        className="border-t border-[#e8eaed] bg-[#f8f9fa] p-4 space-y-3.5 animate-in fade-in duration-150"
      >
        {/* 1. レーン戦14分客観データ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* レーン戦結果 */}
          <div className="bg-white p-3 rounded-lg border border-[#dadce0] space-y-1">
            <span className="text-[11px] font-semibold text-[#5f6368] block">レーン戦結果 (14分時点)</span>
            <div className="flex items-center gap-2">
              {participant.laneOutcome === "win" ? (
                <span className="font-bold text-xs text-[#137333] bg-[#e6f4ea] border border-[#b7e1cd] px-2.5 py-0.5 rounded">
                  レーン勝利
                </span>
              ) : participant.laneOutcome === "loss" ? (
                <span className="font-bold text-xs text-[#c5221f] bg-[#fce8e6] border border-[#fad2cf] px-2.5 py-0.5 rounded">
                  レーン敗北
                </span>
              ) : (
                <span className="font-bold text-xs text-[#5f6368] bg-[#f1f3f4] border border-[#dadce0] px-2.5 py-0.5 rounded">
                  五分
                </span>
              )}
            </div>
          </div>

          {/* ゴールド / CS差 (14分時点) */}
          <div className="bg-white p-3 rounded-lg border border-[#dadce0] space-y-1">
            <span className="text-[11px] font-semibold text-[#5f6368] block">ゴールド / CS差 (14分時点)</span>
            <div className="flex items-center gap-2.5 font-bold text-xs">
              <span className={participant.goldDiffAt14 != null && participant.goldDiffAt14 >= 0 ? "text-[#137333]" : "text-[#c5221f]"}>
                {participant.goldDiffAt14 != null
                  ? `${participant.goldDiffAt14 > 0 ? `+${participant.goldDiffAt14.toLocaleString()}` : participant.goldDiffAt14.toLocaleString()} G`
                  : "- G"}
              </span>
              <span className="text-[#dadce0] font-normal">/</span>
              <span className={participant.csDiffAt14 != null && participant.csDiffAt14 >= 0 ? "text-[#137333]" : "text-[#c5221f]"}>
                {participant.csDiffAt14 != null
                  ? `${participant.csDiffAt14 > 0 ? `+${participant.csDiffAt14}` : participant.csDiffAt14} CS`
                  : "- CS"}
              </span>
            </div>
          </div>
        </div>

        {/* 2. 対面Gold差推移グラフ & キル発生タイムライン */}
        {participant.goldTimeline && participant.goldTimeline.length > 1 && (
          <div data-testid="match-timeline-graph-container">
            <MatchTimelineGraph
              goldTimeline={participant.goldTimeline}
              killEvents={participant.killEvents}
              championName={participant.champion?.name || participant.championName}
              opponentChampionName={participant.opponentChampion?.name || participant.opponentChampionName}
            />
          </div>
        )}

        {/* 3. ビルド購入時系列 (序盤 14分 / 試合全体 切り替え) */}
        {itemGroups.length > 0 && (
          <div className="bg-white p-3.5 rounded-lg border border-[#dadce0] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#202124]">
                <Clock className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span>ビルド購入時系列 (リコール別):</span>
              </div>

              {/* 序盤 / 全体 切り替えタブ */}
              <div className="flex items-center bg-[#f1f3f4] p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemTimelineMode("early");
                  }}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    itemTimelineMode === "early"
                      ? "bg-white text-[#1a73e8] shadow-2xs font-bold"
                      : "text-[#5f6368] hover:text-[#202124]"
                  }`}
                >
                  序盤 (14分まで)
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemTimelineMode("full");
                  }}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    itemTimelineMode === "full"
                      ? "bg-white text-[#1a73e8] shadow-2xs font-bold"
                      : "text-[#5f6368] hover:text-[#202124]"
                  }`}
                >
                  試合全体
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2.5 pt-0.5 scrollbar-thin [scrollbar-width:thin] [scrollbar-color:#dadce0_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#dadce0] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#bdc1c6]">
              {itemGroups.map((grp, gIdx) => (
                <React.Fragment key={gIdx}>
                  {gIdx > 0 && <ArrowRight className="w-3.5 h-3.5 text-[#dadce0] shrink-0" />}
                  <div className="flex items-center gap-1.5 bg-[#f8f9fa] px-2.5 py-1.5 rounded-md border border-[#dadce0] shrink-0">
                    <span className="text-[10px] font-bold text-[#1a73e8] mr-0.5">{grp.timeLabel}</span>
                    <div className="flex items-center gap-1">
                      {grp.itemIds.map((itemId, iIdx) => (
                        <img
                          key={iIdx}
                          src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${itemId}.png`}
                          alt=""
                          className="w-4 h-4 rounded object-cover"
                        />
                      ))}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* 3. 対戦メモ詳細 & 要因タグ */}
        <div className="bg-white p-3 rounded-lg border border-[#dadce0] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2 flex-1">
            <Edit3 className="w-3.5 h-3.5 text-[#1a73e8] shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#202124]">対戦メモ & 気づき:</span>
                {note?.matchupTag && (
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-[#f1f3f4] text-[#3c4043]">
                    {note.matchupTag}
                  </span>
                )}
              </div>
              <p className="text-[#3c4043] leading-relaxed whitespace-pre-wrap">
                {note?.content || "（この試合にはまだメモが記録されていません。気づきや反省を記録しておきましょう）"}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditNote(participant);
            }}
            className="text-xs font-bold text-[#1a73e8] hover:bg-[#e8f0fe] px-3.5 py-1.5 rounded-lg border border-[#d2e3fc] transition cursor-pointer shrink-0 self-start md:self-center"
          >
            {note?.content ? "メモを編集" : "メモを記録"}
          </button>
        </div>
      </div>
    )}
  </div>
);
};

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MatchParticipant } from "@/types/graphql";
import { X, Clock, ArrowRight, Edit3, Shield, Swords, Calendar } from "lucide-react";
import { formatMatchTime, groupEarlyItems } from "@/lib/format";
import { MatchTimelineGraph } from "./MatchTimelineGraph";

interface MatchDetailModalProps {
  participant: MatchParticipant | null;
  isOpen: boolean;
  onClose: () => void;
  onEditNote?: (participant: MatchParticipant) => void;
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

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  participant,
  isOpen,
  onClose,
  onEditNote,
}) => {
  const [itemTimelineMode, setItemTimelineMode] = useState<"early" | "full">("full");

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // モーダルオープン時は背景のスクロールを抑制
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !participant) {
    return null;
  }

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
      data-testid="match-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#dadce0] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#202124] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="p-4 sm:p-5 border-b border-[#dadce0] flex items-center justify-between gap-4 bg-[#f8f9fa] shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            {/* 勝敗バッジ */}
            <span
              className={`px-3 py-1 rounded-lg font-bold text-xs border ${
                isWin
                  ? "bg-[#e8f0fe] text-[#1967d2] border-[#d2e3fc]"
                  : "bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]"
              }`}
            >
              {isWin ? "勝利 (VICTORY)" : "敗北 (DEFEAT)"}
            </span>

            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-[#3c4043] border border-[#dadce0]">
              {participant.queueName || "Solo/Duo"}
            </span>

            <span className="text-xs text-[#5f6368] font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {participant.formattedDuration}
            </span>

            {timeInfo.relative && (
              <span className="text-xs text-[#5f6368] font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {timeInfo.relative} ({timeInfo.absolute})
              </span>
            )}
          </div>

          {/* クローズボタン */}
          <button
            type="button"
            data-testid="modal-close-button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5f6368] hover:text-[#202124] hover:bg-[#dadce0]/50 transition cursor-pointer shrink-0"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* モーダルコンテンツ (スクロール可能) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. チャンピオン対決 & KDAサマリー */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-[#dadce0]">
            {/* 自分 vs 対面 */}
            <div className="flex items-center gap-3">
              {/* 自分 */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Image
                    src={myChampImg}
                    alt={participant.championName}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-xl object-cover border border-[#dadce0]"
                  />
                  {participant.spells && participant.spells.length > 0 && (
                    <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                      {participant.spells.slice(0, 2).map((spellId, idx) => {
                        const spellName = SPELL_IMG_MAP[spellId] || "SummonerFlash";
                        return (
                          <img
                            key={idx}
                            src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/spell/${spellName}.png`}
                            alt=""
                            className="w-3.5 h-3.5 rounded border border-white"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm text-[#202124] block">
                    {participant.champion?.name || participant.championName}
                  </span>
                  <span className="text-[11px] text-[#5f6368] font-medium block">
                    {participant.position || "TOP"}
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold text-[#80868b] px-1">VS</span>

              {/* 対面 */}
              {participant.opponentChampionName ? (
                <div className="flex items-center gap-2">
                  {oppChampImg ? (
                    <Image
                      src={oppChampImg}
                      alt={participant.opponentChampionName}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-xl object-cover border border-[#dadce0]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#f1f3f4] border border-[#dadce0] flex items-center justify-center text-xs text-[#5f6368] font-bold">
                      {participant.opponentChampionName.slice(0, 3)}
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-sm text-[#202124] block">
                      {participant.opponentChampion?.name || participant.opponentChampionName}
                    </span>
                    <span className="text-[11px] text-[#5f6368] font-medium block">対面</span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-[#5f6368] italic">対面なし</span>
              )}
            </div>

            {/* スコア・KDA */}
            <div className="flex items-center sm:justify-end gap-5 text-right">
              <div>
                <span className="text-base font-black text-[#202124] block">
                  {participant.kills} / {participant.deaths} / {participant.assists}
                </span>
                <span
                  className={`text-xs font-bold block ${
                    participant.kdaRatio >= 3 ? "text-[#1967d2]" : "text-[#5f6368]"
                  }`}
                >
                  {participant.kdaRatio} KDA
                </span>
              </div>
              <div className="border-l border-[#dadce0] pl-4 text-left">
                <span className="text-xs font-semibold text-[#202124] block">
                  {participant.cs} CS
                </span>
                <span className="text-[11px] text-[#5f6368] block">
                  {participant.goldEarned ? `${(participant.goldEarned / 1000).toFixed(1)}k Gold` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* 2. レーン戦14分客観スタッツ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* レーン戦結果 */}
            <div className="bg-[#f8f9fa] p-3.5 rounded-xl border border-[#dadce0] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#5f6368] block">レーン戦結果 (14分時点)</span>
                <div className="mt-1 flex items-center gap-2">
                  {participant.laneOutcome === "win" ? (
                    <span className="font-bold text-xs text-[#137333] bg-[#e6f4ea] border border-[#b7e1cd] px-2.5 py-0.5 rounded-md">
                      勝利
                    </span>
                  ) : participant.laneOutcome === "loss" ? (
                    <span className="font-bold text-xs text-[#c5221f] bg-[#fce8e6] border border-[#fad2cf] px-2.5 py-0.5 rounded-md">
                      敗北
                    </span>
                  ) : (
                    <span className="font-bold text-xs text-[#5f6368] bg-[#f1f3f4] border border-[#dadce0] px-2.5 py-0.5 rounded-md">
                      五分
                    </span>
                  )}
                </div>
              </div>
              <Shield className="w-5 h-5 text-[#80868b]" />
            </div>

            {/* ゴールド / CS差 (14分時点) */}
            <div className="bg-[#f8f9fa] p-3.5 rounded-xl border border-[#dadce0] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#5f6368] block">ゴールド / CS差 (14分時点)</span>
                <div className="mt-1 flex items-center gap-2.5 font-bold text-xs">
                  <span
                    className={
                      participant.goldDiffAt14 != null && participant.goldDiffAt14 >= 0
                        ? "text-[#137333]"
                        : "text-[#c5221f]"
                    }
                  >
                    {participant.goldDiffAt14 != null
                      ? `${participant.goldDiffAt14 > 0 ? `+${participant.goldDiffAt14.toLocaleString()}` : participant.goldDiffAt14.toLocaleString()} G`
                      : "- G"}
                  </span>
                  <span className="text-[#dadce0] font-normal">/</span>
                  <span
                    className={
                      participant.csDiffAt14 != null && participant.csDiffAt14 >= 0
                        ? "text-[#137333]"
                        : "text-[#c5221f]"
                    }
                  >
                    {participant.csDiffAt14 != null
                      ? `${participant.csDiffAt14 > 0 ? `+${participant.csDiffAt14}` : participant.csDiffAt14} CS`
                      : "- CS"}
                  </span>
                </div>
              </div>
              <Swords className="w-5 h-5 text-[#80868b]" />
            </div>
          </div>

          {/* 3. 対面Gold差推移 & キル発生タイムライン */}
          {participant.goldTimeline && participant.goldTimeline.length > 1 && (
            <div data-testid="modal-timeline-graph">
              <MatchTimelineGraph
                goldTimeline={participant.goldTimeline}
                killEvents={participant.killEvents}
                championName={participant.champion?.name || participant.championName}
                opponentChampionName={participant.opponentChampion?.name || participant.opponentChampionName}
              />
            </div>
          )}

          {/* 4. ビルド購入時系列 */}
          {itemGroups.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-[#dadce0] space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#202124]">
                  <Clock className="w-4 h-4 text-[#1a73e8]" />
                  <span>ビルド購入時系列 (リコール別):</span>
                </div>

                {/* 序盤 / 全体 切り替えタブ */}
                <div className="flex items-center bg-[#f1f3f4] p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setItemTimelineMode("early")}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      itemTimelineMode === "early"
                        ? "bg-white text-[#1a73e8] shadow-2xs font-bold"
                        : "text-[#5f6368] hover:text-[#202124]"
                    }`}
                  >
                    序盤 (14分まで)
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemTimelineMode("full")}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      itemTimelineMode === "full"
                        ? "bg-white text-[#1a73e8] shadow-2xs font-bold"
                        : "text-[#5f6368] hover:text-[#202124]"
                    }`}
                  >
                    試合全体
                  </button>
                </div>
              </div>

              {/* アイテム購入列 (常設スクロールバー対応) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin [scrollbar-width:thin] [scrollbar-color:#dadce0_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-[#f8f9fa] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#dadce0] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#bdc1c6]">
                {itemGroups.map((grp, gIdx) => (
                  <React.Fragment key={gIdx}>
                    {gIdx > 0 && <ArrowRight className="w-3.5 h-3.5 text-[#dadce0] shrink-0" />}
                    <div className="flex items-center gap-2 bg-[#f8f9fa] px-3 py-2 rounded-lg border border-[#dadce0] shrink-0">
                      <span className="text-[11px] font-bold text-[#1a73e8] mr-0.5">{grp.timeLabel}</span>
                      <div className="flex items-center gap-1.5">
                        {grp.itemIds.map((itemId, iIdx) => (
                          <img
                            key={iIdx}
                            src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${itemId}.png`}
                            alt=""
                            className="w-6 h-6 rounded-md object-cover border border-[#dadce0]"
                          />
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* 5. 最終ビルドアイテム */}
          <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#dadce0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="font-bold text-[#202124]">最終ビルド (試合終了時):</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 6 }).map((_, idx) => {
                const itemId = mainItems[idx] || 0;
                return (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-lg bg-[#202124] border border-[#dadce0] overflow-hidden shrink-0"
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
              {/* Trinket */}
              <div className="w-8 h-8 rounded-full bg-[#202124] border border-[#dadce0] overflow-hidden ml-2 shrink-0">
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
          </div>

          {/* 6. 対戦メモ & 気づき */}
          <div className="bg-white p-4 rounded-xl border border-[#dadce0] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-3 flex-1">
              <Edit3 className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#202124]">対戦メモ & 気づき</span>
                  {note?.matchupTag && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        note.matchupTag === "Hard"
                          ? "bg-[#fef7e0] text-[#b06000] border-[#fce8b2]"
                          : note.matchupTag === "Easy"
                          ? "bg-[#e6f4ea] text-[#137333] border-[#b7e1cd]"
                          : "bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]"
                      }`}
                    >
                      {note.matchupTag}
                    </span>
                  )}
                </div>
                <p className="text-[#3c4043] leading-relaxed whitespace-pre-wrap text-xs">
                  {note?.content || "（この試合にはまだメモが記録されていません。気づきや反省を記録しておきましょう）"}
                </p>
              </div>
            </div>

            {onEditNote && (
              <button
                type="button"
                data-testid="modal-edit-note-button"
                onClick={() => {
                  onEditNote(participant);
                }}
                className="text-xs font-bold text-[#1a73e8] hover:bg-[#e8f0fe] px-4 py-2 rounded-xl border border-[#d2e3fc] transition cursor-pointer shrink-0 self-start md:self-center shadow-2xs"
              >
                {note?.content ? "メモを編集" : "メモを記録"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

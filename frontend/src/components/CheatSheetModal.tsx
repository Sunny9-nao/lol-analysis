"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { MatchupDetail, MatchupSummary } from "@/types/graphql";
import { X, BookOpen, AlertTriangle, ShieldCheck, Sparkles, Trophy, Skull, ArrowRight, ShieldAlert } from "lucide-react";
import { groupEarlyItems } from "@/lib/format";

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: MatchupSummary | null;
  detail: MatchupDetail | null;
  myChampionName: string;
}

export const CheatSheetModal: React.FC<CheatSheetModalProps> = ({
  isOpen,
  onClose,
  summary,
  detail,
  myChampionName,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !summary) return null;

  const oppName = summary.opponentChampion?.name || summary.opponentChampionName;
  const oppImg = summary.opponentChampion?.imageUrl;
  const myName = detail?.champion?.name || myChampionName;
  const myImg = detail?.champion?.imageUrl || `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${myChampionName}.png`;

  // 過去のメモ一覧 (重複除外・最新順)
  const notes = (detail?.participants || [])
    .map((p) => ({
      id: p.id,
      win: p.win,
      kda: `${p.kills}/${p.deaths}/${p.assists}`,
      note: p.matchNote,
      items: p.items || [],
      date: p.gameCreation ? new Date(p.gameCreation).toLocaleDateString() : "",
    }))
    .filter((item) => item.note && item.note.content.trim().length > 0);

  // 勝利した試合のビルド（直近の勝利試合）
  const winningMatches = (detail?.participants || []).filter((p) => p.win);
  const latestWin = winningMatches[0];

  const isHard = summary.hardCount > summary.easyCount || summary.winRate < 45;
  const isEasy = summary.winRate >= 60;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-[#202124]/50 flex items-center justify-center p-4 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl border border-[#dadce0] max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#dadce0] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] border border-[#d2e3fc] flex items-center justify-center text-[#1a73e8]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5f6368]">
                  試合前カンペ (チートシート)
                </span>
                {isHard ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#fef7e0] border border-[#fce8b2] text-[#b06000] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> 要警戒 (Hard)
                  </span>
                ) : isEasy ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#e6f4ea] border border-[#b7e1cd] text-[#137333] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> 得意対面 (Easy)
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f1f3f4] text-[#5f6368]">
                    五分 (Even)
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-[#202124] flex items-center gap-2 mt-0.5">
                <span>{myName}</span>
                <span className="text-sm font-semibold text-[#80868b]">vs</span>
                <span className="text-[#1a73e8]">{oppName}</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#5f6368] hover:text-[#202124] p-1.5 rounded-full hover:bg-[#f1f3f4] transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-3 gap-3 bg-[#f8f9fa] border border-[#e8eaed] rounded-xl p-3 text-center">
          <div>
            <span className="text-[11px] text-[#5f6368] block">過去の対面戦績</span>
            <span className="text-base font-bold text-[#202124]">
              {summary.winCount}勝{summary.matchCount - summary.winCount}敗 ({summary.winRate}%)
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#5f6368] block">平均 KDA</span>
            <span className="text-base font-bold text-[#202124]">
              {summary.averageKda}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#5f6368] block">平均 CS/分</span>
            <span className="text-base font-bold text-[#202124]">
              {summary.averageCsPerMinute}/m
            </span>
          </div>
        </div>

        {/* Section 1: 最重要！過去の自分からの教訓・反省メモ */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#1a73e8]" />
            対{oppName}戦の教訓・注意点メモ (過去の自分より)
          </h3>

          {notes.length > 0 ? (
            <div className="space-y-2.5">
              {notes.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-white border border-[#dadce0] rounded-xl p-3.5 shadow-xs space-y-1.5 hover:border-[#1a73e8]/40 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold flex items-center gap-1 ${item.win ? "text-[#1967d2]" : "text-[#c5221f]"}`}>
                      {item.win ? <Trophy className="w-3.5 h-3.5" /> : <Skull className="w-3.5 h-3.5" />}
                      {item.win ? "勝利した試合" : "敗北した試合"} ({item.kda})
                    </span>
                    {item.note?.matchupTag && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f1f3f4] text-[#3c4043]">
                        {item.note.matchupTag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[#202124] leading-relaxed whitespace-pre-wrap bg-[#f8f9fa] p-2.5 rounded-lg border border-[#e8eaed]">
                    {item.note?.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#f8f9fa] border border-dashed border-[#dadce0] rounded-xl p-6 text-center text-xs text-[#5f6368]">
              まだ対{oppName}戦のメモが記録されていません。
              <br />
              この試合が終わったら、気づいた教訓や相手の癖をメモしておきましょう！
            </div>
          )}
        </div>

        {/* Section 2: 勝利時のビルド・セットアップ */}
        {latestWin ? (
          <div className="space-y-2 border-t border-[#e8eaed] pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#1a73e8]" />
              勝利した試合のビルド傾向 (直近勝利: KDA {latestWin.kills}/{latestWin.deaths}/{latestWin.assists})
            </h3>
            <div className="bg-[#f8f9fa] p-3 rounded-xl border border-[#e8eaed] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#5f6368] mr-1">最終ビルド:</span>
                {Array.from({ length: 6 }).map((_, idx) => {
                  const itemId = (latestWin.items || [])[idx] || 0;
                  return itemId > 0 ? (
                    <div
                      key={idx}
                      className="w-7 h-7 rounded bg-[#202124] border border-[#3c4043] overflow-hidden shrink-0"
                    >
                      <Image
                        src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${itemId}.png`}
                        alt={`Item ${itemId}`}
                        width={28}
                        height={28}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      key={idx}
                      className="w-7 h-7 rounded bg-[#f1f3f4] border border-[#dadce0]"
                    />
                  );
                })}
                {latestWin.items && latestWin.items.length > 6 && latestWin.items[6] > 0 ? (
                  <div className="w-7 h-7 rounded-full bg-[#202124] border border-[#3c4043] overflow-hidden shrink-0 ml-1">
                    <Image
                      src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${latestWin.items[6]}.png`}
                      alt="Trinket"
                      width={28}
                      height={28}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#f1f3f4] border border-[#dadce0] ml-1" />
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#5f6368]">
                {latestWin.goldDiffAt14 != null && (
                  <span className={`font-bold px-2 py-0.5 rounded ${latestWin.goldDiffAt14 >= 0 ? "text-[#137333] bg-[#e6f4ea]" : "text-[#c5221f] bg-[#fce8e6]"}`}>
                    GD@14: {latestWin.goldDiffAt14 > 0 ? `+${latestWin.goldDiffAt14}` : latestWin.goldDiffAt14} G
                  </span>
                )}
                <span>CS: <strong className="text-[#202124]">{latestWin.cs}</strong></span>
              </div>
            </div>

            {/* 序盤の購入フロー (リコール別グループ化) */}
            {(() => {
              const earlyItemGroups = groupEarlyItems(latestWin.earlyItems);
              if (earlyItemGroups.length === 0) return null;
              return (
                <div className="bg-[#f8f9fa] p-2.5 rounded-xl border border-[#e8eaed] text-xs flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <span className="font-bold text-[#5f6368] text-[11px] shrink-0 mr-1">序盤購入順 (14分まで):</span>
                  {earlyItemGroups.map((grp, gIdx) => (
                    <React.Fragment key={gIdx}>
                      {gIdx > 0 && <ArrowRight className="w-3 h-3 text-[#dadce0] shrink-0" />}
                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-[#dadce0] shadow-2xs shrink-0">
                        <span className="text-[10px] font-bold text-[#1a73e8] mr-0.5">{grp.timeLabel}</span>
                        <div className="flex items-center gap-1">
                          {grp.itemIds.map((itemId, iIdx) => (
                            <img
                              key={iIdx}
                              src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${itemId}.png`}
                              alt={`Item ${itemId}`}
                              className="w-4 h-4 rounded object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="space-y-2 border-t border-[#e8eaed] pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#b06000]" />
              対戦アドバイス (過去の勝利実績なし)
            </h3>
            <div className="bg-[#fef7e0] border border-[#fce8b2] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#b06000]">
                  要注意: まだ勝利実績が記録されていないマッチアップです
                </span>
              </div>
              <p className="text-xs text-[#5f6368] leading-relaxed">
                無理なソロキルを狙わず、初手は防具系（ドランシールド、詰め替えポーション、布の鎧等）を優先し、ウェーブをタワー手前でフリーズして味方ジャングラーのガンクを待ちましょう。
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#dadce0] pt-4">
          <span className="text-xs text-[#5f6368]">
            ※ ピック中やロード画面でサッと確認して、レーン戦に集中しましょう。
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-xl shadow-xs transition cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

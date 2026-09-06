"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { MatchParticipant } from "@/types/graphql";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { getChampionImageUrl } from "@/lib/format";

interface GapAnalysisDashboardProps {
  participants: MatchParticipant[];
  onEditNote: (participant: MatchParticipant) => void;
  onSelectMatch?: (participant: MatchParticipant) => void;
}

interface QuadrantMatch {
  participant: MatchParticipant;
  laneOutcome: "win" | "loss" | "even";
  matchOutcome: "win" | "loss";
}

export const GapAnalysisDashboard: React.FC<GapAnalysisDashboardProps> = ({
  participants,
  onEditNote,
  onSelectMatch,
}) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<
    "win-loss" | "win-win" | "loss-win" | "loss-loss" | null
  >(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedQuadrant && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedQuadrant]);

  // 1. 各試合のレーン戦優劣を推定・分類
  const categorizedMatches = useMemo(() => {
    return participants.map((p): QuadrantMatch => {
      let laneOutcome: "win" | "loss" | "even" = "even";

      // 判定ロジック:
      // ① Timeline API による 14分時点の客観判定 (laneOutcome / goldDiffAt14) を最優先
      // ② なければ反省メモの matchupTag またはスタッツによるフォールバック
      if (p.laneOutcome === "win" || p.laneOutcome === "loss" || p.laneOutcome === "even") {
        laneOutcome = p.laneOutcome as "win" | "loss" | "even";
      } else if (p.goldDiffAt14 != null) {
        laneOutcome = p.goldDiffAt14 >= 500 ? "win" : p.goldDiffAt14 <= -500 ? "loss" : "even";
      } else if (p.matchNote?.matchupTag === "Easy") {
        laneOutcome = "win";
      } else if (p.matchNote?.matchupTag === "Hard") {
        laneOutcome = "loss";
      } else if (p.matchNote?.matchupTag === "Even") {
        laneOutcome = "even";
      } else {
        laneOutcome = p.kills >= p.deaths + 2 ? "win" : p.deaths >= p.kills + 3 ? "loss" : "even";
      }

      return {
        participant: p,
        laneOutcome,
        matchOutcome: p.win ? "win" : "loss",
      };
    });
  }, [participants]);

  // 4象限のカウント集計
  const quadrantStats = useMemo(() => {
    const total = categorizedMatches.length || 1;
    const winWin = categorizedMatches.filter(
      (m) => m.laneOutcome === "win" && m.matchOutcome === "win"
    );
    const winLoss = categorizedMatches.filter(
      (m) => m.laneOutcome === "win" && m.matchOutcome === "loss"
    );
    const lossWin = categorizedMatches.filter(
      (m) => m.laneOutcome === "loss" && m.matchOutcome === "win"
    );
    const lossLoss = categorizedMatches.filter(
      (m) => m.laneOutcome === "loss" && m.matchOutcome === "loss"
    );
    const evenMatches = categorizedMatches.filter((m) => m.laneOutcome === "even");

    return {
      winWin: {
        matches: winWin,
        count: winWin.length,
        percentage: Math.round((winWin.length / total) * 100),
      },
      winLoss: {
        matches: winLoss,
        count: winLoss.length,
        percentage: Math.round((winLoss.length / total) * 100),
      },
      lossWin: {
        matches: lossWin,
        count: lossWin.length,
        percentage: Math.round((lossWin.length / total) * 100),
      },
      lossLoss: {
        matches: lossLoss,
        count: lossLoss.length,
        percentage: Math.round((lossLoss.length / total) * 100),
      },
      even: {
        matches: evenMatches,
        count: evenMatches.length,
        percentage: Math.round((evenMatches.length / total) * 100),
      },
    };
  }, [categorizedMatches]);

  // 2. 敗因タグの自動集計 (反省メモ内の【...】を抽出)
  const factorTagStats = useMemo(() => {
    const tagCountMap: Record<string, { count: number; lossCount: number; winCount: number }> = {};
    let totalNotes = 0;

    participants.forEach((p) => {
      const content = p.matchNote?.content;
      if (!content) return;
      totalNotes += 1;

      // 【...】を抽出
      const matches = content.match(/【([^】]+)】/g);
      if (matches) {
        matches.forEach((tag) => {
          const cleanTag = tag.replace(/【|】/g, "").trim();
          if (!tagCountMap[cleanTag]) {
            tagCountMap[cleanTag] = { count: 0, lossCount: 0, winCount: 0 };
          }
          tagCountMap[cleanTag].count += 1;
          if (p.win) {
            tagCountMap[cleanTag].winCount += 1;
          } else {
            tagCountMap[cleanTag].lossCount += 1;
          }
        });
      }
    });

    const sorted = Object.entries(tagCountMap)
      .map(([tag, data]) => ({
        tag,
        ...data,
        lossPercentage: Math.round((data.lossCount / (totalNotes || 1)) * 100),
      }))
      .sort((a, b) => b.lossCount - a.lossCount || b.count - a.count);

    return {
      tags: sorted,
      totalNotes,
    };
  }, [participants]);

  const activeQuadrantMatches = selectedQuadrant
    ? selectedQuadrant === "win-loss"
      ? quadrantStats.winLoss.matches
      : selectedQuadrant === "win-win"
      ? quadrantStats.winWin.matches
      : selectedQuadrant === "loss-win"
      ? quadrantStats.lossWin.matches
      : quadrantStats.lossLoss.matches
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* イントロダクション */}
      <div className="bg-white border border-[#dadce0] rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-[#1a73e8]" />
          <h3 className="font-bold text-sm text-[#202124]">
            レーン戦結果と最終試合結果のギャップ分析 (Performance & Gap)
          </h3>
        </div>
        <p className="text-xs text-[#5f6368] leading-relaxed">
          レーン戦での優劣状況と最終的な試合結果（勝敗）を4象限マトリクスに分類。「レーン戦の課題」と「中盤以降の集団戦・オブジェクト・マクロの課題」を明確に切り分けます。
        </p>
      </div>

      {/* 4象限マトリクス */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 象限 1: レーン勝利 → 試合勝利 */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={selectedQuadrant === "win-win"}
          onClick={() =>
            setSelectedQuadrant(selectedQuadrant === "win-win" ? null : "win-win")
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedQuadrant(selectedQuadrant === "win-win" ? null : "win-win");
            }
          }}
          className={`bg-white border rounded-xl p-4.5 shadow-2xs transition-all duration-150 cursor-pointer hover:shadow-md hover:-translate-y-0.5 select-none ${
            selectedQuadrant === "win-win"
              ? "border-[#137333] ring-2 ring-[#137333]/20 bg-[#f8fdf9]"
              : "border-[#b7e1cd] hover:border-[#137333]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#137333] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              レーン勝利 → 試合勝利 (順当スノーボール)
            </span>
            <span className="text-base font-bold text-[#137333]">
              {quadrantStats.winWin.count} 試合 ({quadrantStats.winWin.percentage}%)
            </span>
          </div>
          <p className="text-xs text-[#5f6368]">
            レーンで対面を圧倒し、リードを活かしてゲームを勝利へ導けた試合。再現性の高い勝ちパターンです。
          </p>
          <div className="mt-3 pt-2 border-t border-[#f1f3f4] flex items-center justify-between text-xs text-[#137333] font-semibold">
            <span>{selectedQuadrant === "win-win" ? "内訳を閉じる" : "内訳・該当試合を確認"}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                selectedQuadrant === "win-win" ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* 象限 2: レーン勝利 → 試合敗北 (最重要改善エリア) */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={selectedQuadrant === "win-loss"}
          onClick={() =>
            setSelectedQuadrant(selectedQuadrant === "win-loss" ? null : "win-loss")
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedQuadrant(selectedQuadrant === "win-loss" ? null : "win-loss");
            }
          }}
          className={`bg-white border rounded-xl p-4.5 shadow-xs transition-all duration-150 cursor-pointer hover:shadow-md hover:-translate-y-0.5 select-none ${
            selectedQuadrant === "win-loss"
              ? "border-[#d93025] ring-2 ring-[#d93025]/30 bg-[#fffbfa]"
              : "border-[#fad2cf] ring-1 ring-[#d93025]/30 hover:border-[#d93025]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#c5221f] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#d93025]" />
              レーン勝利 → 試合敗北 (要改善: 逆転負け / マクロ差)
            </span>
            <span className="text-base font-bold text-[#c5221f]">
              {quadrantStats.winLoss.count} 試合 ({quadrantStats.winLoss.percentage}%)
            </span>
          </div>
          <p className="text-xs text-[#3c4043] font-medium">
            対面には勝っていたものの、中盤・集団戦・孤立キャッチ・オブジェクト判断で逆転された試合。LP向上のための最大の改善領域です。
          </p>
          <div className="mt-3 pt-2 border-t border-[#f1f3f4] flex items-center justify-between text-xs text-[#c5221f] font-semibold">
            <span>{selectedQuadrant === "win-loss" ? "内訳を閉じる" : "主な改善点・該当試合を確認"}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                selectedQuadrant === "win-loss" ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* 象限 3: レーン敗北 → 試合勝利 */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={selectedQuadrant === "loss-win"}
          onClick={() =>
            setSelectedQuadrant(selectedQuadrant === "loss-win" ? null : "loss-win")
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedQuadrant(selectedQuadrant === "loss-win" ? null : "loss-win");
            }
          }}
          className={`bg-white border rounded-xl p-4.5 shadow-2xs transition-all duration-150 cursor-pointer hover:shadow-md hover:-translate-y-0.5 select-none ${
            selectedQuadrant === "loss-win"
              ? "border-[#1a73e8] ring-2 ring-[#1a73e8]/20 bg-[#f8fbff]"
              : "border-[#dadce0] hover:border-[#1a73e8]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#5f6368] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#1a73e8]" />
              レーン敗北 → 試合勝利 (捲り / 味方連携)
            </span>
            <span className="text-base font-bold text-[#202124]">
              {quadrantStats.lossWin.count} 試合 ({quadrantStats.lossWin.percentage}%)
            </span>
          </div>
          <p className="text-xs text-[#5f6368]">
            レーン戦は不利だったものの、デスを最小限に抑えて耐え、集団戦やオブジェクト連動で勝利した試合。
          </p>
          <div className="mt-3 pt-2 border-t border-[#f1f3f4] flex items-center justify-between text-xs text-[#1a73e8] font-semibold">
            <span>{selectedQuadrant === "loss-win" ? "内訳を閉じる" : "内訳・該当試合を確認"}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                selectedQuadrant === "loss-win" ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* 象限 4: レーン敗北 → 試合敗北 */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={selectedQuadrant === "loss-loss"}
          onClick={() =>
            setSelectedQuadrant(selectedQuadrant === "loss-loss" ? null : "loss-loss")
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedQuadrant(selectedQuadrant === "loss-loss" ? null : "loss-loss");
            }
          }}
          className={`bg-white border rounded-xl p-4.5 shadow-2xs transition-all duration-150 cursor-pointer hover:shadow-md hover:-translate-y-0.5 select-none ${
            selectedQuadrant === "loss-loss"
              ? "border-[#d93025] ring-2 ring-[#d93025]/20 bg-[#fffbfa]"
              : "border-[#dadce0] hover:border-[#d93025]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#5f6368] flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-[#d93025]" />
              レーン敗北 → 試合敗北 (完敗 / レーン崩壊)
            </span>
            <span className="text-base font-bold text-[#202124]">
              {quadrantStats.lossLoss.count} 試合 ({quadrantStats.lossLoss.percentage}%)
            </span>
          </div>
          <p className="text-xs text-[#5f6368]">
            レーン戦で大敗し、そのままゲーム全体が崩壊して敗北した試合。序盤の立ち回りや相性理解の改善が必要です。
          </p>
          <div className="mt-3 pt-2 border-t border-[#f1f3f4] flex items-center justify-between text-xs text-[#5f6368] font-semibold">
            <span>{selectedQuadrant === "loss-loss" ? "内訳を閉じる" : "内訳・該当試合を確認"}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                selectedQuadrant === "loss-loss" ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {/* 象限詳細アコーディオン (選択された象限の試合一覧) */}
      {selectedQuadrant && activeQuadrantMatches.length > 0 && (
        <div
          ref={detailRef}
          className="bg-white rounded-xl border border-[#dadce0] p-5 shadow-sm space-y-3 animate-in fade-in duration-150 scroll-mt-6"
        >
          <div className="flex items-center justify-between border-b border-[#f1f3f4] pb-2">
            <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider">
              {selectedQuadrant === "win-loss"
                ? "レーン勝利 → 試合敗北 (逆転負け) の試合一覧"
                : selectedQuadrant === "win-win"
                ? "レーン勝利 → 試合勝利 の試合一覧"
                : selectedQuadrant === "loss-win"
                ? "レーン敗北 → 試合勝利 (捲り) の試合一覧"
                : "レーン敗北 → 試合敗北 の試合一覧"}{" "}
              ({activeQuadrantMatches.length} 試合)
            </h4>
            <button
              onClick={() => setSelectedQuadrant(null)}
              className="text-xs text-[#5f6368] hover:text-[#202124] cursor-pointer"
            >
              閉じる
            </button>
          </div>

          <div className="space-y-2">
            {activeQuadrantMatches.map((m) => {
              const p = m.participant;
              const note = p.matchNote;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectMatch?.(p)}
                  className="bg-[#f8f9fa] border border-[#e8eaed] hover:border-[#1a73e8]/50 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        p.win
                          ? "bg-[#e8f0fe] text-[#1967d2]"
                          : "bg-[#fce8e6] text-[#c5221f]"
                      }`}
                    >
                      {p.win ? "勝利" : "敗北"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Image
                        src={getChampionImageUrl(p.championName, p.champion?.imageUrl)}
                        alt={p.championName}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded object-cover border border-[#dadce0]"
                      />
                      <span className="font-bold text-[#202124]">{p.champion?.name || p.championName}</span>
                      <span className="text-[#80868b] font-medium">vs</span>
                      {p.opponentChampionName && (
                        <Image
                          src={getChampionImageUrl(p.opponentChampionName, p.opponentChampion?.imageUrl)}
                          alt={p.opponentChampionName || ""}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded object-cover border border-[#dadce0]"
                        />
                      )}
                      <span className="font-bold text-[#202124]">
                        {p.opponentChampion?.name || p.opponentChampionName || "対面"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-[#5f6368]">
                    <span>
                      KDA: <strong className="text-[#202124]">{p.kills}/{p.deaths}/{p.assists}</strong> ({p.kdaRatio})
                    </span>
                    {p.goldDiffAt14 != null && (
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          p.goldDiffAt14 >= 500
                            ? "bg-[#e6f4ea] text-[#137333] border border-[#b7e1cd]"
                            : p.goldDiffAt14 <= -500
                            ? "bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]"
                            : "bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]"
                        }`}
                      >
                        GD@14: {p.goldDiffAt14 > 0 ? `+${p.goldDiffAt14.toLocaleString()}` : `${p.goldDiffAt14.toLocaleString()}`} G
                      </span>
                    )}
                  </div>

                  {/* Note snippet & Detail badge */}
                  <div className="flex items-center gap-2 flex-1 max-w-sm justify-end">
                    <div className="flex-1 min-w-0">
                      {note?.content ? (
                        <p className="text-[11px] text-[#3c4043] truncate italic bg-white px-2 py-1 rounded border border-[#e8eaed] w-full">
                          &ldquo;{note.content}&rdquo;
                        </p>
                      ) : (
                        <span className="text-[11px] text-[#80868b] italic">（メモ未記入）</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditNote(p);
                      }}
                      className="text-xs text-[#1a73e8] hover:underline shrink-0 font-medium cursor-pointer"
                    >
                      {note?.content ? "編集" : "メモ追加"}
                    </button>
                    {onSelectMatch && (
                      <span className="text-[11px] font-bold text-[#1a73e8] bg-[#e8f0fe] group-hover:bg-[#d2e3fc] px-2 py-1 rounded transition whitespace-nowrap shrink-0">
                        詳細
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 敗因ワーストランキング (反省メモの要因タグ自動集計) */}
      <div className="bg-white rounded-xl border border-[#dadce0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#202124] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1a73e8]" />
              直近の敗因ワーストランキング (振り返りメモの要因タグ自動集計)
            </h3>
            <p className="text-xs text-[#5f6368] mt-0.5">
              試合後のメモで選択された【要因タグ】を自動集約し、負けにつながる行動パターンを可視化します。
            </p>
          </div>
          <span className="text-xs text-[#5f6368]">
            記録メモ: <strong className="text-[#202124]">{factorTagStats.totalNotes}</strong> 件
          </span>
        </div>

        {factorTagStats.tags.length > 0 ? (
          <div className="space-y-3.5 pt-1">
            {factorTagStats.tags.slice(0, 6).map((item, idx) => {
              const barColor =
                idx === 0
                  ? "bg-[#d93025]"
                  : idx === 1
                  ? "bg-[#b06000]"
                  : idx === 2
                  ? "bg-[#fbbc04]"
                  : "bg-[#5f6368]";

              const textColor =
                idx === 0
                  ? "text-[#c5221f]"
                  : idx === 1
                  ? "text-[#b06000]"
                  : "text-[#202124]";

              return (
                <div key={item.tag} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={textColor}>
                      {idx + 1}位: {item.tag}
                    </span>
                    <span className="text-[#5f6368] font-normal">
                      敗北 {item.lossCount}回 (全{item.count}回中)
                    </span>
                  </div>
                  <div className="w-full bg-[#f1f3f4] rounded-full h-2 overflow-hidden">
                    <div
                      className={`${barColor} h-2 rounded-full transition-all duration-300`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(10, Math.round((item.lossCount / (factorTagStats.totalNotes || 1)) * 100))
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#f8f9fa] border border-dashed border-[#dadce0] rounded-xl p-8 text-center text-xs text-[#5f6368] space-y-1">
            <p className="font-semibold text-[#202124]">要因タグデータがまだありません</p>
            <p>
              試合後のメモ作成時に「+ ガンク被弾」「+ スキルCDトレード負け」などのクイック要因タグをタップして記録すると、ここに敗因ランキングが集計されます。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

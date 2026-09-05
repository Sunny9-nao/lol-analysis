"use client";

import React, { useState } from "react";
import { GoldTimelinePoint, TimelineKillEvent } from "@/types/graphql";
import { Swords, Skull, ShieldAlert } from "lucide-react";

interface MatchTimelineGraphProps {
  goldTimeline?: GoldTimelinePoint[] | null;
  killEvents?: TimelineKillEvent[] | null;
  championName: string;
  opponentChampionName?: string | null;
}

export const MatchTimelineGraph: React.FC<MatchTimelineGraphProps> = ({
  goldTimeline,
  killEvents,
  championName,
  opponentChampionName,
}) => {
  const [hoveredEvent, setHoveredEvent] = useState<{
    event: TimelineKillEvent;
    x: number;
    y: number;
  } | null>(null);

  const [hoveredPoint, setHoveredPoint] = useState<{
    point: GoldTimelinePoint;
    x: number;
    y: number;
  } | null>(null);

  if (!goldTimeline || goldTimeline.length < 2) {
    return (
      <div className="bg-white p-4 rounded-lg border border-[#dadce0] text-center text-xs text-[#5f6368]">
        タイムラインデータがありません
      </div>
    );
  }

  // ViewBox 寸法
  const svgWidth = 720;
  const svgHeight = 180;
  const padding = { top: 28, bottom: 28, left: 55, right: 25 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // X軸の範囲 (0分〜最終分)
  const maxMinute = Math.max(15, goldTimeline[goldTimeline.length - 1].minute);

  // Y軸の範囲 (最大絶対Gold差を基準に対称化)
  const allDiffs = goldTimeline.map((p) => p.goldDiff || 0);
  const rawMaxDiff = Math.max(1000, ...allDiffs.map(Math.abs));
  // 500刻みで切り上げ
  const maxAbsDiff = Math.ceil(rawMaxDiff / 500) * 500;

  const zeroY = padding.top + innerHeight / 2;

  const getX = (minute: number) => {
    return padding.left + (minute / maxMinute) * innerWidth;
  };

  const getY = (diff: number) => {
    return zeroY - (diff / maxAbsDiff) * (innerHeight / 2);
  };

  // 折れ線パス生成
  const points = goldTimeline.map((p) => ({
    x: getX(p.minute),
    y: getY(p.goldDiff || 0),
    data: p,
  }));

  const linePathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  // 上（プラス領域）と下（マイナス領域）の塗りつぶし用パス
  const positiveAreaD = `${linePathD} L ${points[points.length - 1].x},${zeroY} L ${points[0].x},${zeroY} Z`;

  // X軸の目盛り（5分刻み）
  const xTicks: number[] = [];
  for (let m = 0; m <= maxMinute; m += 5) {
    xTicks.push(m);
  }

  // キルイベントの座標特定（分に対応するGold差を線形補間または近似）
  const getGoldDiffAtMinute = (targetMinute: number) => {
    if (goldTimeline.length === 0) return 0;
    const lower = goldTimeline.filter((p) => p.minute <= targetMinute).pop();
    const upper = goldTimeline.find((p) => p.minute >= targetMinute);
    if (!lower && !upper) return 0;
    if (!lower) return upper?.goldDiff || 0;
    if (!upper || lower.minute === upper.minute) return lower.goldDiff || 0;

    const ratio = (targetMinute - lower.minute) / (upper.minute - lower.minute);
    const lowGd = lower.goldDiff || 0;
    const upGd = upper.goldDiff || 0;
    return lowGd + (upGd - lowGd) * ratio;
  };

  // 自分または対面が関与したイベント（バックエンドでフィルタ済み）
  const processedEvents = (killEvents || []).map((ev) => {
    const ex = getX(ev.minute);
    const estimatedGd = getGoldDiffAtMinute(ev.minute);
    const ey = getY(estimatedGd);
    return { ...ev, x: ex, y: ey };
  });

  return (
    <div className="bg-white p-4 rounded-lg border border-[#dadce0] space-y-2.5 select-none">
      {/* グラフヘッダー & 凡例 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#202124]">対面Gold差推移 & キル発生タイムライン</span>
          {opponentChampionName && (
            <span className="text-[11px] text-[#5f6368]">
              ({championName} vs {opponentChampionName})
            </span>
          )}
        </div>

        {/* 凡例 */}
        <div className="flex items-center gap-2.5 text-[10px] text-[#5f6368] font-medium flex-wrap">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-[#1a73e8] rounded-full" />
            <span>自有利 (+)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-[#d93025] rounded-full" />
            <span>対面有利 (-)</span>
          </div>
          <span className="text-[#dadce0]">|</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8] border border-white inline-block shadow-xs" />
            <span>対面キル</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#1967d2] inline-block" />
            <span>キル</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#12b5cb] inline-block" />
            <span>対面デス</span>
          </div>
          <span className="text-[#dadce0]">|</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d93025] border border-white inline-block shadow-xs" />
            <span>対面にデス</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#c5221f] inline-block" />
            <span>デス</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#e37400] inline-block" />
            <span>対面キル</span>
          </div>
        </div>
      </div>

      {/* SVG チャート */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[560px] overflow-visible"
        >
          <defs>
            {/* 上部グラデーション (青) */}
            <linearGradient id="positiveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1a73e8" stopOpacity="0.0" />
            </linearGradient>
            {/* 下部グラデーション (赤) */}
            <linearGradient id="negativeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d93025" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#d93025" stopOpacity="0.25" />
            </linearGradient>

            {/* クリップパス (0Gの上側) */}
            <clipPath id="clipAboveZero">
              <rect
                x={padding.left}
                y={padding.top}
                width={innerWidth}
                height={innerHeight / 2}
              />
            </clipPath>
            {/* クリップパス (0Gの下側) */}
            <clipPath id="clipBelowZero">
              <rect
                x={padding.left}
                y={zeroY}
                width={innerWidth}
                height={innerHeight / 2}
              />
            </clipPath>
          </defs>

          {/* 背景グリッド & Y軸ラベル */}
          {/* +maxAbsDiff */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={svgWidth - padding.right}
            y2={padding.top}
            stroke="#f1f3f4"
            strokeWidth="1"
          />
          <text
            x={padding.left - 6}
            y={padding.top + 4}
            textAnchor="end"
            className="text-[9px] fill-[#80868b] font-medium"
          >
            +{maxAbsDiff >= 1000 ? `${(maxAbsDiff / 1000).toFixed(1)}k` : maxAbsDiff}
          </text>

          {/* 0G (五分) 基準線 */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={svgWidth - padding.right}
            y2={zeroY}
            stroke="#dadce0"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          <text
            x={padding.left - 6}
            y={zeroY + 3}
            textAnchor="end"
            className="text-[9px] fill-[#5f6368] font-bold"
          >
            0G
          </text>

          {/* -maxAbsDiff */}
          <line
            x1={padding.left}
            y1={padding.top + innerHeight}
            x2={svgWidth - padding.right}
            y2={padding.top + innerHeight}
            stroke="#f1f3f4"
            strokeWidth="1"
          />
          <text
            x={padding.left - 6}
            y={padding.top + innerHeight + 3}
            textAnchor="end"
            className="text-[9px] fill-[#80868b] font-medium"
          >
            -{maxAbsDiff >= 1000 ? `${(maxAbsDiff / 1000).toFixed(1)}k` : maxAbsDiff}
          </text>

          {/* 塗りつぶし領域 (プラス: 青, マイナス: 赤) */}
          <path d={positiveAreaD} fill="url(#positiveGrad)" clipPath="url(#clipAboveZero)" />
          <path d={positiveAreaD} fill="url(#negativeGrad)" clipPath="url(#clipBelowZero)" />

          {/* メインの折れ線 */}
          <path
            d={linePathD}
            fill="none"
            stroke="#1a73e8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X軸の目盛り & 分ラベル */}
          {xTicks.map((m) => {
            const tx = getX(m);
            return (
              <g key={m}>
                <line
                  x1={tx}
                  y1={padding.top + innerHeight}
                  x2={tx}
                  y2={padding.top + innerHeight + 4}
                  stroke="#dadce0"
                  strokeWidth="1"
                />
                <text
                  x={tx}
                  y={padding.top + innerHeight + 15}
                  textAnchor="middle"
                  className="text-[9px] fill-[#80868b] font-medium"
                >
                  {m}分
                </text>
              </g>
            );
          })}

          {/* ホバー可能なデータポイント */}
          {points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r="4"
              className="fill-transparent hover:fill-[#1a73e8] hover:stroke-white hover:stroke-2 cursor-pointer transition"
              onMouseEnter={() =>
                setHoveredPoint({
                  point: pt.data,
                  x: pt.x,
                  y: pt.y,
                })
              }
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* キルイベントピン (自分または対面の関与) */}
          {processedEvents.map((ev, idx) => {
            const isSoloKill = ev.category === "solo_kill_opp";
            const isDeathToOpp = ev.category === "death_to_opp";
            const isMyKill = ev.category === "my_kill";
            const isMyDeath = ev.category === "my_death";
            const isOppDeath = ev.category === "opp_death";
            const isOppKill = ev.category === "opp_kill";

            const pinColor = isSoloKill
              ? "#1a73e8"
              : isDeathToOpp
              ? "#d93025"
              : isMyKill
              ? "#1967d2"
              : isMyDeath
              ? "#c5221f"
              : isOppDeath
              ? "#12b5cb"
              : isOppKill
              ? "#e37400"
              : "#5f6368";

            const isDirectClash = isSoloKill || isDeathToOpp;
            const baseRadius = isDirectClash ? 6 : 4.5;
            const isHovered = hoveredEvent?.event === ev;
            const currentRadius = isHovered ? baseRadius + 1.5 : baseRadius;

            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredEvent({
                    event: ev,
                    x: ev.x,
                    y: ev.y,
                  })
                }
                onMouseLeave={() => setHoveredEvent(null)}
              >
                {/* 直接対決の目立つ外輪 */}
                {isDirectClash && (
                  <circle
                    cx={ev.x}
                    cy={ev.y}
                    r={currentRadius + 3}
                    fill={pinColor}
                    fillOpacity="0.25"
                    className="animate-pulse"
                  />
                )}
                {/* ホバー時の薄いハイライト外輪 */}
                {isHovered && !isDirectClash && (
                  <circle
                    cx={ev.x}
                    cy={ev.y}
                    r={currentRadius + 2.5}
                    fill={pinColor}
                    fillOpacity="0.2"
                  />
                )}
                {/* メインピン (CSS scaleを使わずSVG ネイティブ属性で拡縮し、位置ズレを解消) */}
                <circle
                  cx={ev.x}
                  cy={ev.y}
                  r={currentRadius}
                  fill={pinColor}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2 : 1.2}
                />
              </g>
            );
          })}
        </svg>

        {/* ツールチップ (キルイベント) */}
        {hoveredEvent && (
          <div
            style={{
              left: `${(hoveredEvent.x / svgWidth) * 100}%`,
              top: `${hoveredEvent.y - 10}px`,
              transform: "translate(-50%, -100%)",
            }}
            className="absolute z-20 pointer-events-none bg-[#202124] text-white text-[10px] rounded-lg px-2.5 py-1.5 shadow-lg space-y-0.5 whitespace-nowrap animate-in fade-in duration-100"
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  hoveredEvent.event.category === "solo_kill_opp"
                    ? "bg-[#1a73e8]"
                    : hoveredEvent.event.category === "my_kill"
                    ? "bg-[#1967d2]"
                    : hoveredEvent.event.category === "opp_death"
                    ? "bg-[#12b5cb]"
                    : hoveredEvent.event.category === "death_to_opp"
                    ? "bg-[#d93025]"
                    : hoveredEvent.event.category === "my_death"
                    ? "bg-[#c5221f]"
                    : hoveredEvent.event.category === "opp_kill"
                    ? "bg-[#e37400]"
                    : "bg-[#80868b]"
                }`}
              />
              <span>
                {hoveredEvent.event.timestamp} - {hoveredEvent.event.label}
              </span>
            </div>
            <div className="text-[#dadce0] text-[9px]">
              {hoveredEvent.event.killer} ➔ {hoveredEvent.event.victim}
            </div>
          </div>
        )}

        {/* ツールチップ (毎分Goldポイント) */}
        {!hoveredEvent && hoveredPoint && (
          <div
            style={{
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${hoveredPoint.y - 10}px`,
              transform: "translate(-50%, -100%)",
            }}
            className="absolute z-10 pointer-events-none bg-[#202124] text-white text-[10px] rounded-md px-2 py-1 shadow-md whitespace-nowrap animate-in fade-in duration-75"
          >
            <span className="font-bold">{hoveredPoint.point.minute}分</span>:{" "}
            <span
              className={
                (hoveredPoint.point.goldDiff || 0) >= 0
                  ? "text-[#8ab4f8] font-bold"
                  : "text-[#f28b82] font-bold"
              }
            >
              {(hoveredPoint.point.goldDiff || 0) > 0 ? "+" : ""}
              {(hoveredPoint.point.goldDiff || 0).toLocaleString()} G
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

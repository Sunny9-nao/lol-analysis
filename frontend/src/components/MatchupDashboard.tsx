"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { PlayedChampion, MatchupSummary, MatchupDetail, MatchParticipant } from "@/types/graphql";
import { fetchGraphQL, GET_MATCHUP_SUMMARIES_QUERY, GET_MATCHUP_DETAIL_QUERY, GET_COUNTER_RECOMMENDATIONS_QUERY } from "@/lib/graphql-client";
import { ChevronDown, Edit3, Loader2, Search, AlertTriangle, Trophy, BookOpen, ShieldCheck, ArrowRight, X } from "lucide-react";
import { CheatSheetModal } from "@/components/CheatSheetModal";
import { groupEarlyItems } from "@/lib/format";

interface MatchupDashboardProps {
  gameName: string;
  tagLine: string;
  playedChampions: PlayedChampion[];
  onEditNote: (participant: MatchParticipant) => void;
  onSelectMatch?: (participant: MatchParticipant) => void;
  lastSavedNote?: { participantId: string; matchNote: { id: string; content: string; matchupTag: string; updatedAt: string } } | null;
}

export const MatchupDashboard: React.FC<MatchupDashboardProps> = ({
  gameName,
  tagLine,
  playedChampions,
  onEditNote,
  onSelectMatch,
  lastSavedNote,
}) => {
  const [selectedChampion, setSelectedChampion] = useState<string>(
    playedChampions[0]?.championName || ""
  );
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"count" | "worst" | "best" | "hard">("count");

  const [summaries, setSummaries] = useState<MatchupSummary[]>([]);
  const [loadedSummaryKey, setLoadedSummaryKey] = useState<string | null>(null);

  // 展開中の対面名
  const [expandedOpponent, setExpandedOpponent] = useState<string | null>(null);
  const [detailsCache, setDetailsCache] = useState<Record<string, MatchupDetail>>({});
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // カンペモーダル状態
  const [cheatSheetSummary, setCheatSheetSummary] = useState<MatchupSummary | null>(null);
  const [cheatSheetDetail, setCheatSheetDetail] = useState<MatchupDetail | null>(null);

  // 相手チャンプ逆引き検索状態 (UC-A1)
  const [reverseOpponentInput, setReverseOpponentInput] = useState<string>("");
  const [reverseRecommendations, setReverseRecommendations] = useState<MatchupSummary[]>([]);
  const [isLoadingReverse, setIsLoadingReverse] = useState<boolean>(false);
  const summaryRequestKey = [gameName, tagLine, selectedChampion, positionFilter].join("\u0000");
  const isLoadingSummaries = Boolean(selectedChampion) && loadedSummaryKey !== summaryRequestKey;
  const visibleReverseRecommendations = reverseOpponentInput.trim()
    ? reverseRecommendations
    : [];

  // 逆引き検索ハンドラ
  useEffect(() => {
    if (!reverseOpponentInput.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingReverse(true);
      try {
        const data = await fetchGraphQL<{ searchSummoner: { counterRecommendations: MatchupSummary[] } }>(
          GET_COUNTER_RECOMMENDATIONS_QUERY,
          {
            gameName,
            tagLine,
            opponentChampionName: reverseOpponentInput.trim(),
            position: positionFilter || null,
          }
        );
        setReverseRecommendations(data.searchSummoner?.counterRecommendations || []);
      } catch (err) {
        console.error("Failed to fetch counter recommendations:", err);
      } finally {
        setIsLoadingReverse(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [reverseOpponentInput, gameName, tagLine, positionFilter]);

  const handleOpenCheatSheet = async (summary: MatchupSummary, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCheatSheetSummary(summary);

    if (detailsCache[summary.opponentChampionName]) {
      setCheatSheetDetail(detailsCache[summary.opponentChampionName]);
      return;
    }

    try {
      const data = await fetchGraphQL<{ searchSummoner: { matchupDetail: MatchupDetail } }>(
        GET_MATCHUP_DETAIL_QUERY,
        {
          gameName,
          tagLine,
          championName: selectedChampion,
          opponentChampionName: summary.opponentChampionName,
          position: positionFilter || null,
        }
      );
      if (data.searchSummoner?.matchupDetail) {
        setDetailsCache((prev) => ({
          ...prev,
          [summary.opponentChampionName]: data.searchSummoner.matchupDetail,
        }));
        setCheatSheetDetail(data.searchSummoner.matchupDetail);
      }
    } catch (err) {
      console.error("Failed to load detail for cheat sheet:", err);
    }
  };

  // フィルタとソートの適用
  const filteredAndSortedSummaries = React.useMemo(() => {
    return summaries
      .filter((s) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const enName = s.opponentChampionName.toLowerCase();
        const jaName = (s.opponentChampion?.name || "").toLowerCase();
        return enName.includes(term) || jaName.includes(term);
      })
      .sort((a, b) => {
        if (sortBy === "count") {
          return b.matchCount - a.matchCount || b.winRate - a.winRate;
        } else if (sortBy === "worst") {
          // 苦手順: 勝率が低い順（試合数が2以上のものを優先）
          return a.winRate - b.winRate || b.matchCount - a.matchCount;
        } else if (sortBy === "best") {
          // 得意順: 勝率が高い順
          return b.winRate - a.winRate || b.matchCount - a.matchCount;
        } else if (sortBy === "hard") {
          // Hardタグが多い順
          return b.hardCount - a.hardCount || b.matchCount - a.matchCount;
        }
        return 0;
      });
  }, [summaries, searchTerm, sortBy]);

  // 初期選択またはチャンピオン変更時に対面サマリを取得
  useEffect(() => {
    if (!selectedChampion) return;

    let isMounted = true;

    fetchGraphQL<{ searchSummoner: { matchupSummaries: MatchupSummary[] } }>(
      GET_MATCHUP_SUMMARIES_QUERY,
      {
        gameName,
        tagLine,
        championName: selectedChampion,
        position: positionFilter || null,
      }
    )
      .then((data) => {
        if (isMounted) {
          setSummaries(data.searchSummoner?.matchupSummaries || []);
          setLoadedSummaryKey(summaryRequestKey);
          setExpandedOpponent(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load matchup summaries:", err);
        if (isMounted) {
          setSummaries([]);
          setLoadedSummaryKey(summaryRequestKey);
          setExpandedOpponent(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [gameName, tagLine, selectedChampion, positionFilter, summaryRequestKey]);

  // アコーディオン展開
  const handleToggleAccordion = async (opponentName: string) => {
    if (expandedOpponent === opponentName) {
      setExpandedOpponent(null);
      return;
    }

    setExpandedOpponent(opponentName);

    // キャッシュがなければ詳細を取得
    if (!detailsCache[opponentName]) {
      setIsLoadingDetail(true);
      try {
        const data = await fetchGraphQL<{ searchSummoner: { matchupDetail: MatchupDetail } }>(
          GET_MATCHUP_DETAIL_QUERY,
          {
            gameName,
            tagLine,
            championName: selectedChampion,
            opponentChampionName: opponentName,
            position: positionFilter || null,
          }
        );
        if (data.searchSummoner?.matchupDetail) {
          setDetailsCache((prev) => ({
            ...prev,
            [opponentName]: data.searchSummoner.matchupDetail,
          }));
        }
      } catch (err) {
        console.error("Failed to load matchup detail:", err);
      } finally {
        setIsLoadingDetail(false);
      }
    }
  };

  const selectedChampObj = playedChampions.find((c) => c.championName === selectedChampion);
  const selectedChampDisplayName = selectedChampObj?.champion?.name || selectedChampion;

  if (playedChampions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#dadce0] p-12 text-center text-[#5f6368] space-y-2">
        <p className="font-semibold text-base text-[#202124]">対面分析データがありません</p>
        <p className="text-xs">
          サモナーズリフト（CLASSIC）での対面データが記録されている試合がまだありません。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Champion Selector & Reverse Counter Search Bar */}
      <div className="bg-white rounded-xl border border-[#dadce0] p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider shrink-0">
              使用チャンピオン:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {playedChampions.map((champ) => {
                const isSelected = champ.championName === selectedChampion;
                const imgUrl =
                  champ.champion?.imageUrl ||
                  "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Jax.png";

                return (
                  <button
                    key={champ.championName}
                    onClick={() => {
                      setSelectedChampion(champ.championName);
                      setReverseOpponentInput("");
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                      isSelected
                        ? "bg-[#1a73e8] text-white shadow-2xs"
                        : "bg-[#f8f9fa] border border-[#dadce0] text-[#3c4043] hover:bg-[#e8eaed]"
                    }`}
                  >
                    <Image src={imgUrl} alt={champ.championName} width={16} height={16} unoptimized className="w-4 h-4 rounded object-cover" />
                    <span>{champ.champion?.name || champ.championName}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] ${
                        isSelected ? "bg-white/20 text-white" : "bg-[#dadce0] text-[#3c4043]"
                      }`}
                    >
                      {champ.matchCount}試合 / {champ.winRate}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* UC-A1: 相手チャンプ逆引き検索バー */}
          <div className="relative w-full lg:w-72 shrink-0">
            <input
              type="text"
              value={reverseOpponentInput}
              onChange={(e) => setReverseOpponentInput(e.target.value)}
              placeholder="相手チャンプ名で逆引き... (例: エイトロックス)"
              className="w-full pl-8 pr-8 py-2 bg-[#f8f9fa] border border-[#dadce0] focus:border-[#1a73e8] focus:bg-white rounded-lg text-xs text-[#202124] outline-none transition placeholder-[#80868b]"
            />
            <div className="absolute left-2.5 top-2.5 text-[#5f6368]">
              <Search className="w-3.5 h-3.5" />
            </div>
            {isLoadingReverse ? (
              <div className="absolute right-3 top-2.5 text-[#1a73e8]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
            ) : reverseOpponentInput ? (
              <button
                type="button"
                onClick={() => setReverseOpponentInput("")}
                className="absolute right-2.5 top-2 text-[#5f6368] hover:text-[#202124] p-0.5 rounded-full hover:bg-[#dadce0]/50 transition cursor-pointer"
                title="入力をクリア"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* 逆引きレコメンド結果カード (UC-A1) */}
        {reverseOpponentInput.trim() && (
          <div className="bg-[#e8f0fe] border border-[#d2e3fc] rounded-lg p-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1967d2] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                対「{reverseOpponentInput}」におけるあなたの戦績比較 (推奨カウンター):
              </span>
              <span className="text-[11px] text-[#5f6368]">個人実績データ準拠</span>
            </div>

            {visibleReverseRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleReverseRecommendations.map((rec, idx) => {
                  const isTop = idx === 0 && rec.winRate >= 50;
                  return (
                    <div
                      key={rec.championName || idx}
                      className={`bg-white p-3 rounded-lg border shadow-2xs flex items-center justify-between ${
                        isTop ? "border-[#b7e1cd]" : "border-[#dadce0]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            isTop ? "bg-[#e6f4ea] text-[#137333]" : "bg-[#f1f3f4] text-[#5f6368]"
                          }`}
                        >
                          {isTop ? "推奨 1" : `選択肢 ${idx + 1}`}
                        </span>
                        {rec.champion?.imageUrl && (
                          <Image
                            src={rec.champion.imageUrl}
                            alt={rec.championName || ""}
                            width={28}
                            height={28}
                            unoptimized
                            className="w-7 h-7 rounded object-cover"
                          />
                        )}
                        <div>
                          <span className="font-bold text-xs text-[#202124] block">
                            {rec.champion?.name || rec.championName}
                          </span>
                          <span className="text-[11px] text-[#5f6368]">
                            {rec.winCount}勝{rec.matchCount - rec.winCount}敗 (勝率 {rec.winRate}% / KDA {rec.averageKda})
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (rec.championName) {
                            setSelectedChampion(rec.championName);
                            handleOpenCheatSheet(rec);
                          }
                        }}
                        className="text-xs font-bold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] px-2.5 py-1 rounded transition cursor-pointer"
                      >
                        対策カンペ
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : !isLoadingReverse ? (
              <p className="text-xs text-[#5f6368] py-1">
                対「{reverseOpponentInput}」の対戦データはまだありません。
              </p>
            ) : null}
          </div>
        )}
      </div>


      {/* Quick Insights (天敵ワースト ＆ 得意相性) */}
      {!isLoadingSummaries && summaries.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 天敵ワースト */}
          {(() => {
            const worst = [...summaries]
              .filter((s) => s.matchCount >= 2 && s.winRate <= 40)
              .sort((a, b) => a.winRate - b.winRate || b.matchCount - a.matchCount)[0];
            if (!worst) return null;
            return (
              <div
                onClick={() => handleToggleAccordion(worst.opponentChampionName)}
                className="bg-white border border-[#fad2cf] hover:border-[#d93025] rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer shadow-xs transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#fce8e6] text-[#c5221f] flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#c5221f] uppercase tracking-wider">
                        苦手マッチアップ
                      </span>
                      <span className="text-xs font-bold text-[#202124]">
                        vs {worst.opponentChampion?.name || worst.opponentChampionName}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5f6368] line-clamp-1">
                      {worst.latestNote?.content || "過去メモを確認して対策を立てましょう"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-[#d93025] block">
                    勝率 {worst.winRate}%
                  </span>
                  <span className="text-[10px] text-[#5f6368]">{worst.matchCount}試合</span>
                </div>
              </div>
            );
          })()}

          {/* 得意相性 */}
          {(() => {
            const best = [...summaries]
              .filter((s) => s.matchCount >= 2 && s.winRate >= 70)
              .sort((a, b) => b.winRate - a.winRate || b.matchCount - a.matchCount)[0];
            if (!best) return null;
            return (
              <div
                onClick={() => handleToggleAccordion(best.opponentChampionName)}
                className="bg-white border border-[#d2e3fc] hover:border-[#1a73e8] rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer shadow-xs transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e8f0fe] text-[#1967d2] flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#1967d2] uppercase tracking-wider">
                        得意マッチアップ
                      </span>
                      <span className="text-xs font-bold text-[#202124]">
                        vs {best.opponentChampion?.name || best.opponentChampionName}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5f6368] line-clamp-1">
                      {best.latestNote?.content || "高い勝率を維持しています"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-[#1a73e8] block">
                    勝率 {best.winRate}%
                  </span>
                  <span className="text-[10px] text-[#5f6368]">{best.matchCount}試合</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Matchup Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="対面チャンピオン名で検索..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#dadce0] rounded-lg text-xs text-[#202124] focus:border-[#1a73e8] outline-none transition placeholder-[#80868b]"
          />
          <div className="absolute left-2.5 top-2 text-[#5f6368]">
            <Search className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#5f6368]">ロール:</span>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="bg-white border border-[#dadce0] text-[#3c4043] rounded-lg px-2.5 py-1.5 outline-none text-xs cursor-pointer font-medium"
            >
              <option value="">すべて</option>
              <option value="TOP">TOP</option>
              <option value="JUNGLE">JUNGLE</option>
              <option value="MIDDLE">MID</option>
              <option value="BOTTOM">ADC</option>
              <option value="UTILITY">SUP</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#5f6368]">並び順:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "count" | "worst" | "best" | "hard")}
              className="bg-white border border-[#dadce0] text-[#3c4043] rounded-lg px-2.5 py-1.5 outline-none text-xs cursor-pointer font-medium"
            >
              <option value="count">試合数が多い順</option>
              <option value="worst">勝率が低い順 (苦手マッチアップ)</option>
              <option value="best">勝率が高い順 (得意マッチアップ)</option>
              <option value="hard">Hardタグが多い順</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matchup Summary List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#5f6368] px-2 font-medium">
          <span>対面チャンピオン一覧 (カードをクリックで過去の全試合・メモを展開)</span>
          <span>{filteredAndSortedSummaries.length} 対面</span>
        </div>

        {isLoadingSummaries ? (
          <div className="bg-white rounded-xl border border-[#dadce0] p-8 text-center text-[#5f6368] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#1a73e8]" />
            <span className="text-xs">対面データを集計中...</span>
          </div>
        ) : filteredAndSortedSummaries.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#dadce0] p-8 text-center text-[#5f6368] text-xs">
            該当する対面データがありません。
          </div>
        ) : (
          filteredAndSortedSummaries.map((summary) => {
            const isExpanded = expandedOpponent === summary.opponentChampionName;
            const oppImg = summary.opponentChampion?.imageUrl;
            const detail = detailsCache[summary.opponentChampionName];

            return (
              <div
                key={summary.opponentChampionName}
                className="bg-white rounded-xl border border-[#dadce0] overflow-hidden shadow-sm hover:border-[#1a73e8]/50 transition-all"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => handleToggleAccordion(summary.opponentChampionName)}
                  className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                >
                  <div className="flex items-center gap-4 min-w-[220px]">
                    {oppImg ? (
                      <Image
                        src={oppImg}
                        alt={summary.opponentChampionName}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-xl object-cover border border-[#e8eaed]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#f1f3f4] border border-[#dadce0] flex items-center justify-center text-xs text-[#5f6368] font-bold">
                        {summary.opponentChampionName.slice(0, 3)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-[#202124]">
                          {summary.opponentChampion?.name || summary.opponentChampionName}
                        </h3>
                        {summary.hardCount > 0 && (
                          <span className="text-[10px] font-semibold bg-[#fef7e0] text-[#b06000] border border-[#fce8b2] px-2 py-0.5 rounded-full">
                            Hard {summary.hardCount}件
                          </span>
                        )}
                        {summary.easyCount > 0 && (
                          <span className="text-[10px] font-semibold bg-[#e6f4ea] text-[#137333] border border-[#b7e1cd] px-2 py-0.5 rounded-full">
                            Easy {summary.easyCount}件
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5f6368] mt-0.5">
                        {summary.matchCount} 試合記録
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-6 text-center text-xs flex-1 max-w-sm">
                    <div>
                      <span className="text-[11px] text-[#5f6368] block">対面勝率</span>
                      <span
                        className={`font-bold text-sm ${
                          summary.winRate >= 50 ? "text-[#1a73e8]" : "text-[#d93025]"
                        }`}
                      >
                        {summary.winRate}%
                      </span>
                      <span className="text-[10px] text-[#5f6368] block">
                        ({summary.winCount}勝 {summary.matchCount - summary.winCount}敗)
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#5f6368] block">平均 KDA</span>
                      <span className="font-bold text-sm text-[#202124]">
                        {summary.averageKda}
                      </span>
                      <span className="text-[10px] text-[#5f6368] block">比率</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#5f6368] block">平均 CS/分</span>
                      <span className="font-bold text-sm text-[#202124]">
                        {summary.averageCsPerMinute}
                      </span>
                      <span className="text-[10px] text-[#5f6368] block">minions/m</span>
                    </div>
                  </div>

                  {/* Latest Note Snippet */}
                  <div className="hidden lg:block max-w-xs text-xs bg-[#f8f9fa] border border-[#e8eaed] rounded-lg p-2.5 text-[#3c4043] flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5f6368] mb-0.5">
                      <Edit3 className="w-3 h-3 text-[#1a73e8]" />
                      最新メモ
                    </div>
                    <p className="line-clamp-2">
                      {summary.latestNote?.content || "（メモ未記入）"}
                    </p>
                  </div>

                  {/* Actions: Cheat Sheet & Expand Arrow */}
                  <div className="flex items-center gap-2 pl-2">
                    <button
                      type="button"
                      onClick={(e) => handleOpenCheatSheet(summary, e)}
                      title="試合前カンペ（チートシート）を開く"
                      className="text-xs font-bold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] px-3 py-1.5 rounded-lg border border-[#d2e3fc] transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>カンペ</span>
                    </button>
                    <div className="text-[#5f6368] flex items-center justify-center p-1">
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-[#1a73e8]" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-[#dadce0] bg-[#f8f9fa] p-5 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider flex items-center gap-2">
                        <span>vs {summary.opponentChampion?.name || summary.opponentChampionName} 過去の対戦履歴 & メモ</span>
                        <span className="text-[11px] text-[#5f6368] font-normal">
                          (全 {summary.matchCount} 試合)
                        </span>
                      </h4>
                    </div>

                    {isLoadingDetail && !detail ? (
                      <div className="p-6 text-center text-xs text-[#5f6368] flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a73e8]" />
                        <span>試合詳細を取得中...</span>
                      </div>
                    ) : detail && detail.participants ? (
                      <div className="space-y-3">
                        {detail.participants.map((rawP) => {
                          const p = lastSavedNote && lastSavedNote.participantId === rawP.id
                            ? { ...rawP, matchNote: lastSavedNote.matchNote }
                            : rawP;
                          const note = p.matchNote;
                          const earlyItemGroups = groupEarlyItems(p.earlyItems);
                          return (
                            <div
                              key={p.id}
                              onClick={() => onSelectMatch?.(p)}
                              className="bg-white rounded-xl border border-[#dadce0] hover:border-[#1a73e8]/50 p-4 flex flex-col gap-3 shadow-2xs transition cursor-pointer group"
                            >
                              {/* 上段: 勝敗、試合時間、KDA/CS/GD@14、ビルド、メモ */}
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-w-0">
                                {/* 左ブロック: 勝敗 + 試合時間 + KDA + GD14 + ビルド */}
                                <div className="flex flex-wrap items-center gap-3 min-w-0 flex-1">
                                  {/* 勝敗バッジ (固定幅・改行防止) */}
                                  <span
                                    className={`w-14 text-center text-xs font-bold py-1 rounded-md border shrink-0 whitespace-nowrap ${
                                      p.win
                                        ? "bg-[#e8f0fe] text-[#1967d2] border-[#d2e3fc]"
                                        : "bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]"
                                    }`}
                                  >
                                    {p.win ? "勝利" : "敗北"}
                                  </span>

                                  {/* 試合時間 */}
                                  <span className="text-xs text-[#5f6368] shrink-0 font-medium">
                                    {p.formattedDuration}
                                  </span>

                                  <span className="text-[#dadce0] hidden sm:inline">•</span>

                                  {/* KDA & CS */}
                                  <div className="flex items-center gap-1.5 shrink-0 text-xs">
                                    <span className="font-bold text-[#202124]">
                                      {p.kills} / {p.deaths} / {p.assists}
                                    </span>
                                    <span className="text-[#5f6368] text-[11px]">
                                      ({p.kdaRatio} KDA • {p.cs} CS)
                                    </span>
                                  </div>

                                  {/* 14分差 バッジ */}
                                  {p.goldDiffAt14 != null && (
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                                        p.goldDiffAt14 >= 500
                                          ? "bg-[#e6f4ea] text-[#137333] border border-[#b7e1cd]"
                                          : p.goldDiffAt14 <= -500
                                          ? "bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]"
                                          : "bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]"
                                      }`}
                                    >
                                      14分差: {p.goldDiffAt14 > 0 ? `+${p.goldDiffAt14}` : p.goldDiffAt14}
                                    </span>
                                  )}

                                  {/* 最終ビルド 6枠 */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    {(p.items || []).slice(0, 6).map((itemId, idx) => (
                                      <div
                                        key={idx}
                                        className="w-6 h-6 rounded bg-[#202124] border border-[#dadce0] overflow-hidden shrink-0"
                                      >
                                        {itemId > 0 ? (
                                          <Image
                                            src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${itemId}.png`}
                                            alt=""
                                            width={24}
                                            height={24}
                                            unoptimized
                                            className="w-full h-full object-cover"
                                          />
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* 右ブロック: メモ欄 & 詳細リンク (min-w-0 と truncate でカード枠内にはみ出さず収める) */}
                                <div className="flex items-center gap-2 w-full lg:w-72 xl:w-80 min-w-0 shrink-0">
                                  <div className="bg-[#fff8e1] border border-[#ffe082] rounded-lg p-2 text-xs text-[#3c4043] flex items-center justify-between gap-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      {note?.matchupTag && (
                                        <span
                                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded text-white shrink-0 ${
                                            note.matchupTag === "Hard"
                                              ? "bg-[#b06000]"
                                              : note.matchupTag === "Easy"
                                              ? "bg-[#137333]"
                                              : "bg-[#5f6368]"
                                          }`}
                                        >
                                          {note.matchupTag}
                                        </span>
                                      )}
                                      <span
                                        className="truncate text-[11px] text-[#3c4043] min-w-0 flex-1 block"
                                        title={note?.content || ""}
                                      >
                                        {note?.content || "（メモなし）"}
                                      </span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditNote(p);
                                      }}
                                      className="text-[#1a73e8] hover:text-[#1557b0] text-[11px] font-bold shrink-0 cursor-pointer ml-1"
                                    >
                                      {note?.content ? "編集" : "追加"}
                                    </button>
                                  </div>
                                  {onSelectMatch && (
                                    <span className="text-[11px] font-bold text-[#1a73e8] bg-[#e8f0fe] group-hover:bg-[#d2e3fc] px-2.5 py-1.5 rounded-md transition whitespace-nowrap hidden sm:inline-block shrink-0">
                                      詳細
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 下段: 序盤の購入フロー (リコール別グループ化) */}
                              {earlyItemGroups.length > 0 && (
                                <div className="bg-[#f8f9fa] -mx-4 -mb-4 p-2.5 px-4 rounded-b-xl border-t border-[#f1f3f4] flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                  <span className="text-[11px] font-bold text-[#5f6368] shrink-0 mr-1">
                                    序盤購入:
                                  </span>
                                  {earlyItemGroups.map((grp, gIdx) => (
                                    <React.Fragment key={gIdx}>
                                      {gIdx > 0 && <ArrowRight className="w-3 h-3 text-[#dadce0] shrink-0" />}
                                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-[#dadce0] shadow-2xs shrink-0">
                                        <span className="text-[10px] font-bold text-[#1a73e8] mr-0.5">
                                          {grp.timeLabel}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          {grp.itemIds.map((itemId, iIdx) => (
                                            <Image
                                              key={iIdx}
                                              src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${itemId}.png`}
                                              alt=""
                                              width={16}
                                              height={16}
                                              unoptimized
                                              className="w-4 h-4 rounded object-cover"
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    </React.Fragment>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Cheat Sheet Modal (試合前カンペ) */}
      <CheatSheetModal
        isOpen={!!cheatSheetSummary}
        onClose={() => {
          setCheatSheetSummary(null);
          setCheatSheetDetail(null);
        }}
        summary={cheatSheetSummary}
        detail={cheatSheetDetail}
        myChampionName={selectedChampDisplayName}
      />
    </div>
  );
};

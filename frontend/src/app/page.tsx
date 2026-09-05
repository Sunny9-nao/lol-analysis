"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { SummonerProfile } from "@/components/SummonerProfile";
import { Tabs, TabType } from "@/components/Tabs";
import { MatchList } from "@/components/MatchList";
import { MatchupDashboard } from "@/components/MatchupDashboard";
import { GapAnalysisDashboard } from "@/components/GapAnalysisDashboard";
import { NoteEditorModal } from "@/components/NoteEditorModal";
import { MatchDetailModal } from "@/components/MatchDetailModal";
import { RecentMatchBanner } from "@/components/RecentMatchBanner";
import { Summoner, MatchParticipant } from "@/types/graphql";
import { fetchGraphQL, SEARCH_SUMMONER_QUERY, SAVE_MATCH_NOTE_MUTATION } from "@/lib/graphql-client";
import { Loader2, AlertCircle } from "lucide-react";

export default function Home() {
  const [gameName, setGameName] = useState<string>("Sunny9");
  const [tagLine, setTagLine] = useState<string>("hono");
  const [summoner, setSummoner] = useState<Summoner | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("matchups");

  // メモ編集モーダル状態
  const [editingParticipant, setEditingParticipant] = useState<MatchParticipant | null>(null);

  // 試合詳細モーダル状態
  const [selectedMatchParticipant, setSelectedMatchParticipant] = useState<MatchParticipant | null>(null);

  // 試合履歴を試合日時 (gameCreation) の降順 (最新順) にソート
  const sortedParticipants = useMemo(() => {
    return [...(summoner?.matchParticipants || [])].sort((a, b) => {
      const timeA = a.gameCreation ? new Date(a.gameCreation).getTime() : 0;
      const timeB = b.gameCreation ? new Date(b.gameCreation).getTime() : 0;
      return timeB - timeA;
    });
  }, [summoner?.matchParticipants]);

  // サモナー検索関数
  const loadSummoner = useCallback(async (name: string, tag: string, force: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGraphQL<{ searchSummoner: Summoner | null }>(SEARCH_SUMMONER_QUERY, {
        gameName: name,
        tagLine: tag,
        force,
      });

      if (!data.searchSummoner) {
        setError(`サモナー "${name}#${tag}" が見つかりませんでした。`);
        setSummoner(null);
      } else {
        setSummoner(data.searchSummoner);
        setGameName(name);
        setTagLine(tag);
        // LocalStorageに保存
        if (typeof window !== "undefined") {
          localStorage.setItem("lol_analysis_last_summoner", `${name}#${tag}`);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`データの取得に失敗しました: ${errorMessage}`);
      setSummoner(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初期ロード (LocalStorageから復元、なければSunny9#hono)
  useEffect(() => {
    let isCurrent = true;
    let initialName = "Sunny9";
    let initialTag = "hono";

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lol_analysis_last_summoner");
      if (saved && saved.includes("#")) {
        const [n, t] = saved.split("#");
        if (n && t) {
          initialName = n;
          initialTag = t;
        }
      }
    }

    const loadInitialSummoner = async () => {
      try {
        const data = await fetchGraphQL<{ searchSummoner: Summoner | null }>(SEARCH_SUMMONER_QUERY, {
          gameName: initialName,
          tagLine: initialTag,
          force: false,
        });
        if (!isCurrent) return;

        if (!data.searchSummoner) {
          setError(`サモナー "${initialName}#${initialTag}" が見つかりませんでした。`);
          setSummoner(null);
        } else {
          setSummoner(data.searchSummoner);
          setGameName(initialName);
          setTagLine(initialTag);
          localStorage.setItem("lol_analysis_last_summoner", `${initialName}#${initialTag}`);
        }
      } catch (err: unknown) {
        if (!isCurrent) return;
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`データの取得に失敗しました: ${errorMessage}`);
        setSummoner(null);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void loadInitialSummoner();
    return () => {
      isCurrent = false;
    };
  }, []);

  // メモ保存処理
  const handleSaveNote = async (participantId: string, content: string, matchupTag: string) => {
    const data = await fetchGraphQL<{
      saveMatchNote: { matchNote: { id: string; content: string; matchupTag: string; updatedAt: string }; errors: string[] };
    }>(SAVE_MATCH_NOTE_MUTATION, {
      input: {
        matchParticipantId: participantId,
        content,
        matchupTag,
      },
    });

    if (data.saveMatchNote.errors && data.saveMatchNote.errors.length > 0) {
      throw new Error(data.saveMatchNote.errors.join(", "));
    }

    // UIを即時反映
    if (summoner) {
      setSummoner({
        ...summoner,
        matchParticipants: summoner.matchParticipants.map((p) =>
          p.id === participantId
            ? { ...p, matchNote: data.saveMatchNote.matchNote }
            : p
        ),
      });
    }

    if (selectedMatchParticipant && selectedMatchParticipant.id === participantId) {
      setSelectedMatchParticipant({
        ...selectedMatchParticipant,
        matchNote: data.saveMatchNote.matchNote,
      });
    }
  };

  return (
    <div className="bg-[#f8f9fa] text-[#202124] min-h-screen antialiased flex flex-col">
      {/* Google Style Header */}
      <Header
        onSearch={(name, tag) => loadSummoner(name, tag)}
        isLoading={isLoading}
        initialQuery={`${gameName}#${tagLine}`}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-6 flex-1 w-full space-y-6">
        {isLoading && !summoner ? (
          <div className="bg-white rounded-2xl border border-[#dadce0] p-16 flex flex-col items-center justify-center gap-3 text-[#5f6368] shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8]" />
            <p className="text-sm font-medium">サモナー情報と戦績を同期中...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-[#fad2cf] p-8 text-center text-[#c5221f] space-y-2 shadow-sm">
            <AlertCircle className="w-8 h-8 mx-auto text-[#d93025]" />
            <p className="font-bold text-base">{error}</p>
            <p className="text-xs text-[#5f6368]">
              Riot IDが正しいか、またはバックエンドAPIが起動しているか確認してください。
            </p>
          </div>
        ) : summoner ? (
          <>
            {/* Summoner Overview Card */}
            <SummonerProfile
              summoner={summoner}
              onRefresh={() => loadSummoner(gameName, tagLine, true)}
              isRefreshing={isLoading}
            />

            {/* Recent Match Prompt (UC-2: 試合直後クイック反省サジェスト) */}
            {sortedParticipants && sortedParticipants.length > 0 && (
              <RecentMatchBanner
                latestParticipant={sortedParticipants[0]}
                onEditNote={(participant) => setEditingParticipant(participant)}
                onSelectMatch={(participant) => setSelectedMatchParticipant(participant)}
              />
            )}

            {/* Navigation Tabs */}
            <Tabs activeTab={activeTab} onChange={setActiveTab} />

            {/* Tab Views */}
            {activeTab === "matchups" ? (
              <MatchupDashboard
                gameName={gameName}
                tagLine={tagLine}
                playedChampions={summoner.playedChampions || []}
                onEditNote={(participant) => setEditingParticipant(participant)}
                onSelectMatch={(participant) => setSelectedMatchParticipant(participant)}
              />
            ) : activeTab === "gap" ? (
              <GapAnalysisDashboard
                participants={sortedParticipants}
                onEditNote={(participant) => setEditingParticipant(participant)}
                onSelectMatch={(participant) => setSelectedMatchParticipant(participant)}
              />
            ) : (
              <MatchList
                participants={sortedParticipants}
                onEditNote={(participant) => setEditingParticipant(participant)}
                onSelectMatch={(participant) => setSelectedMatchParticipant(participant)}
              />
            )}
          </>
        ) : null}
      </main>

      {/* Match Detail Modal (UC: 試合詳細・タイムライングラフ・キルピン・ビルド購入時系列) */}
      <MatchDetailModal
        key={selectedMatchParticipant?.id ?? "detail-closed"}
        isOpen={!!selectedMatchParticipant}
        participant={selectedMatchParticipant}
        onClose={() => setSelectedMatchParticipant(null)}
        onEditNote={(participant) => setEditingParticipant(participant)}
      />

      {/* Note Editor Modal */}
      <NoteEditorModal
        key={editingParticipant?.id ?? "closed"}
        isOpen={!!editingParticipant}
        onClose={() => setEditingParticipant(null)}
        onSave={handleSaveNote}
        participant={editingParticipant}
        initialContent={editingParticipant?.matchNote?.content || ""}
        initialTag={editingParticipant?.matchNote?.matchupTag || "Hard"}
      />
    </div>
  );
}

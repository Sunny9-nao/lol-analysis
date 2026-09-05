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
import { AuthModal } from "@/components/AuthModal";
import { LinkSummonerModal } from "@/components/LinkSummonerModal";
import { LegalModal } from "@/components/LegalModal";
import { DeleteAccountModal } from "@/components/DeleteAccountModal";
import { Summoner, MatchParticipant, User } from "@/types/graphql";
import {
  fetchGraphQL,
  ME_QUERY,
  MY_SUMMONER_QUERY,
  SAVE_MATCH_NOTE_MUTATION,
  getAuthToken,
  removeAuthToken,
} from "@/lib/graphql-client";
import { Loader2, AlertCircle } from "lucide-react";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [summoner, setSummoner] = useState<Summoner | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("matchups");

  // モーダル状態
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<"terms" | "privacy">("terms");
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState<boolean>(false);
  const [editingParticipant, setEditingParticipant] = useState<MatchParticipant | null>(null);
  const [selectedMatchParticipant, setSelectedMatchParticipant] = useState<MatchParticipant | null>(null);
  const [lastSavedNote, setLastSavedNote] = useState<{
    participantId: string;
    matchNote: { id: string; content: string; matchupTag: string; updatedAt: string };
  } | null>(null);

  // 試合履歴を降順 (最新順) にソート
  const sortedParticipants = useMemo(() => {
    return [...(summoner?.matchParticipants || [])].sort((a, b) => {
      const timeA = a.gameCreation ? new Date(a.gameCreation).getTime() : 0;
      const timeB = b.gameCreation ? new Date(b.gameCreation).getTime() : 0;
      return timeB - timeA;
    });
  }, [summoner?.matchParticipants]);

  // ログインユーザー本人のサモナーデータを取得
  const loadMySummoner = useCallback(async (force: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGraphQL<{ mySummoner: Summoner | null }>(MY_SUMMONER_QUERY, { force });

      if (!data.mySummoner) {
        setSummoner(null);
        setIsLinkModalOpen(true);
      } else {
        setSummoner(data.mySummoner);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`データの取得に失敗しました: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ログインユーザー情報のロード
  // 初回ロード (マウント時に認証とマイサモナーを初期化)
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        if (isMounted) {
          setIsLoading(false);
          setIsAuthModalOpen(true);
        }
        return;
      }

      try {
        const data = await fetchGraphQL<{ me: User | null }>(ME_QUERY);
        if (!isMounted) return;

        if (data.me) {
          setCurrentUser(data.me);
          if (data.me.summoner) {
            await loadMySummoner(false);
          } else {
            setIsLoading(false);
            setIsLinkModalOpen(true);
          }
        } else {
          removeAuthToken();
          setCurrentUser(null);
          setIsAuthModalOpen(true);
          setIsLoading(false);
        }
      } catch {
        if (!isMounted) return;
        removeAuthToken();
        setCurrentUser(null);
        setIsAuthModalOpen(true);
        setIsLoading(false);
      }
    };

    void initAuth();

    return () => {
      isMounted = false;
    };
  }, [loadMySummoner]);

  // ログアウト処理
  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
    setSummoner(null);
    setIsAuthModalOpen(true);
  };

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

    setLastSavedNote({
      participantId,
      matchNote: data.saveMatchNote.matchNote,
    });
  };

  const handleAccountDeleted = () => {
    setIsDeleteAccountModalOpen(false);
    setCurrentUser(null);
    setSummoner(null);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="bg-[#f8f9fa] text-[#202124] min-h-screen antialiased flex flex-col">
      {/* Header (個人専用ダッシュボード / 同期 / ログアウト / アカウント削除) */}
      <Header
        user={currentUser}
        summoner={summoner}
        isLoading={isLoading}
        onSync={() => loadMySummoner(true)}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onDeleteAccount={() => setIsDeleteAccountModalOpen(true)}
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
              onRefresh={() => loadMySummoner(true)}
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
                gameName={summoner.gameName}
                tagLine={summoner.tagLine}
                playedChampions={summoner.playedChampions || []}
                onEditNote={(participant) => setEditingParticipant(participant)}
                onSelectMatch={(participant) => setSelectedMatchParticipant(participant)}
                lastSavedNote={lastSavedNote}
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
        ) : (
          <div className="bg-white rounded-2xl border border-[#dadce0] p-12 text-center text-[#5f6368] space-y-3 shadow-sm">
            <p className="text-sm font-semibold text-[#202124]">
              個人専用ランクアップ分析を利用するにはサインインしてください
            </p>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-lg transition shadow-2xs"
            >
              サインインして始める
            </button>
          </div>
        )}
      </main>

      {/* Auth Modal (サインイン / 新規登録) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onSuccess={(user) => {
          setIsAuthModalOpen(false);
          setCurrentUser(user);
          if (user.summoner) {
            void loadMySummoner(false);
          } else {
            setIsLinkModalOpen(true);
          }
        }}
      />

      {/* Link Summoner Modal (Riot ID 登録) */}
      <LinkSummonerModal
        isOpen={isLinkModalOpen}
        onSuccess={(linkedSummoner) => {
          setIsLinkModalOpen(false);
          if (currentUser) {
            setCurrentUser({
              ...currentUser,
              summoner: linkedSummoner,
            });
          }
          void loadMySummoner(false);
        }}
      />

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

      {/* Legal Modal (利用規約 / プライバシーポリシー) */}
      <LegalModal
        isOpen={isLegalModalOpen}
        activeTab={legalModalTab}
        onTabChange={setLegalModalTab}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* Delete Account Modal (アカウント・反省メモの完全削除) */}
      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onDeleted={handleAccountDeleted}
      />

      {/* Riot Games 公式免責事項 (Legal Jibber Jabber 準拠) & 法務リンク */}
      <footer className="border-t border-[#dadce0] bg-white py-6 px-6 mt-12 text-center text-[11px] text-[#5f6368] space-y-3">
        <div className="max-w-4xl mx-auto space-y-2 leading-relaxed">
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-[#5f6368]">
            <button
              type="button"
              data-testid="footer-terms-btn"
              onClick={() => {
                setLegalModalTab("terms");
                setIsLegalModalOpen(true);
              }}
              className="hover:text-[#1a73e8] hover:underline transition cursor-pointer"
            >
              利用規約
            </button>
            <span>•</span>
            <button
              type="button"
              data-testid="footer-privacy-btn"
              onClick={() => {
                setLegalModalTab("privacy");
                setIsLegalModalOpen(true);
              }}
              className="hover:text-[#1a73e8] hover:underline transition cursor-pointer"
            >
              プライバシーポリシー
            </button>
          </div>
          <p>
            LoLRankupLab isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
          </p>
          <p className="text-[10px] text-[#80868b]">
            © 2026 LoLRankupLab - Personal SoloQ Improvement Companion
          </p>
        </div>
      </footer>
    </div>
  );
}

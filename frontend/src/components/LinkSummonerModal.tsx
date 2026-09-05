"use client";

import React, { useState } from "react";
import { ShieldCheck, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { fetchGraphQL, LINK_SUMMONER_MUTATION } from "@/lib/graphql-client";
import { Summoner, User as UserType } from "@/types/graphql";

interface LinkSummonerModalProps {
  isOpen: boolean;
  onSuccess: (summoner: Summoner) => void;
}

export const LinkSummonerModal: React.FC<LinkSummonerModalProps> = ({ isOpen, onSuccess }) => {
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const data = await fetchGraphQL<{
        linkSummoner: { user: UserType | null; summoner: Summoner | null; errors: string[] };
      }>(LINK_SUMMONER_MUTATION, { gameName, tagLine });

      if (data.linkSummoner.errors && data.linkSummoner.errors.length > 0) {
        setErrorMessage(data.linkSummoner.errors.join(", "));
        return;
      }

      if (data.linkSummoner.summoner) {
        onSuccess(data.linkSummoner.summoner);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "サモナーの連携に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoSummoner = () => {
    setGameName("Sunny9");
    setTagLine("hono");
    setErrorMessage(null);
  };

  return (
    <div
      data-testid="link-summoner-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-[#dadce0] shadow-xl w-full max-w-md overflow-hidden p-6 sm:p-8 space-y-6">
        {/* ヘッダー */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#e6f4ea] text-[#137333] flex items-center justify-center mx-auto shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#202124]">
            自身の Riot ID を登録
          </h2>
          <p className="text-xs text-[#5f6368]">
            あなたの戦績データと対面分析を同期するために、LoLの Riot ID を1度だけ登録してください
          </p>
        </div>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="bg-[#fce8e6] border border-[#fad2cf] text-[#c5221f] text-xs p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* 入力フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#3c4043]">Game Name (名前)</label>
            <input
              type="text"
              data-testid="link-gamename-input"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="例: Sunny9"
              required
              className="w-full text-xs bg-[#f8f9fa] border border-[#dadce0] rounded-lg px-3 py-2 outline-none focus:border-[#1a73e8] focus:bg-white transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#3c4043]">Tag Line (#以降)</label>
            <input
              type="text"
              data-testid="link-tagline-input"
              value={tagLine}
              onChange={(e) => setTagLine(e.target.value)}
              placeholder="例: hono または JP1"
              required
              className="w-full text-xs bg-[#f8f9fa] border border-[#dadce0] rounded-lg px-3 py-2 outline-none focus:border-[#1a73e8] focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            data-testid="link-submit-btn"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-lg transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>サモナーを連携して開始</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 開発用デモサモナー簡単入力 */}
        <div className="pt-3 border-t border-[#f1f3f4] text-center">
          <button
            type="button"
            data-testid="demo-summoner-btn"
            onClick={handleFillDemoSummoner}
            className="text-[11px] text-[#1a73e8] hover:text-[#1557b0] hover:underline font-medium cursor-pointer"
          >
            開発用サンプルサモナー (Sunny9#hono) を入力
          </button>
        </div>
      </div>
    </div>
  );
};

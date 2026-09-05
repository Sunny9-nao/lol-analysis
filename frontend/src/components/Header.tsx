"use client";

import React from "react";
import { Zap, RefreshCw, LogOut, User as UserIcon, Trash2 } from "lucide-react";
import { User, Summoner } from "@/types/graphql";

interface HeaderProps {
  user?: User | null;
  summoner?: Summoner | null;
  isLoading?: boolean;
  onSync?: () => void;
  onLogout?: () => void;
  onOpenAuth?: () => void;
  onDeleteAccount?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  summoner,
  isLoading,
  onSync,
  onLogout,
  onOpenAuth,
  onDeleteAccount,
}) => {
  return (
    <header className="bg-white border-b border-[#dadce0] sticky top-0 z-30 px-6 py-3 shadow-[0_1px_2px_rgba(60,64,67,0.08)]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white font-bold text-base shadow-sm">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-[#202124]">
                LoL<span className="text-[#1a73e8]">RankupLab</span>
              </span>
              <span className="text-[10px] bg-[#e8f0fe] text-[#1a73e8] font-bold px-2 py-0.5 rounded-full">
                Personal Coach
              </span>
            </div>
            <p className="text-[11px] text-[#5f6368] hidden sm:block">
              個人専用ソロキュー分析・反省メモ
            </p>
          </div>
        </div>

        {/* User Account / Action Controls */}
        <div className="flex items-center gap-3 justify-end flex-wrap">
          {user ? (
            <>
              {/* 連携サモナー情報 */}
              {summoner && (
                <div className="flex items-center gap-2 bg-[#f8f9fa] border border-[#dadce0] px-3 py-1.5 rounded-lg text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#137333]" />
                  <span className="font-bold text-[#202124]">{summoner.riotId}</span>
                </div>
              )}

              {/* 最新試合を同期ボタン */}
              {onSync && (
                <button
                  type="button"
                  data-testid="header-sync-btn"
                  onClick={onSync}
                  disabled={isLoading || summoner?.syncStatus === "syncing"}
                  className="px-3 py-1.5 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1a73e8] text-xs font-bold rounded-lg border border-[#d2e3fc] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Riot APIから最新の試合データを取得"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading || summoner?.syncStatus === "syncing" ? "animate-spin" : ""}`} />
                  <span>{summoner?.syncStatus === "syncing" ? "同期中..." : "最新試合を同期"}</span>
                </button>
              )}

              {/* ユーザーアカウント & アクション */}
              <div className="flex items-center gap-2 pl-2 border-l border-[#dadce0]">
                <div className="text-right hidden md:block">
                  <span className="text-xs font-medium text-[#3c4043] block">{user.email}</span>
                </div>
                {onDeleteAccount && (
                  <button
                    type="button"
                    data-testid="header-delete-account-btn"
                    onClick={onDeleteAccount}
                    className="p-1.5 text-[#5f6368] hover:text-[#d93025] hover:bg-[#fce8e6] rounded-lg transition cursor-pointer"
                    title="アカウントとデータを完全削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {onLogout && (
                  <button
                    type="button"
                    data-testid="header-logout-btn"
                    onClick={onLogout}
                    className="p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#e8eaed] rounded-lg transition cursor-pointer"
                    title="ログアウト"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <button
              type="button"
              data-testid="header-login-btn"
              onClick={onOpenAuth}
              className="px-4 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>サインイン</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

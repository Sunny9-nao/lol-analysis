"use client";

import React, { useState } from "react";
import { User, LogIn, UserPlus, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { fetchGraphQL, setAuthToken, SIGN_IN_MUTATION, SIGN_UP_MUTATION } from "@/lib/graphql-client";
import { User as UserType } from "@/types/graphql";

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess }) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const data = await fetchGraphQL<{
          signIn: { user: UserType | null; authToken: string | null; errors: string[] };
        }>(SIGN_IN_MUTATION, { email, password });

        if (data.signIn.errors && data.signIn.errors.length > 0) {
          setErrorMessage(data.signIn.errors.join(", "));
          return;
        }

        if (data.signIn.authToken && data.signIn.user) {
          setAuthToken(data.signIn.authToken);
          onSuccess(data.signIn.user);
        }
      } else {
        const data = await fetchGraphQL<{
          signUp: { user: UserType | null; authToken: string | null; errors: string[] };
        }>(SIGN_UP_MUTATION, { email, password });

        if (data.signUp.errors && data.signUp.errors.length > 0) {
          setErrorMessage(data.signUp.errors.join(", "));
          return;
        }

        if (data.signUp.authToken && data.signUp.user) {
          setAuthToken(data.signUp.authToken);
          onSuccess(data.signUp.user);
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "認証処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoUser = () => {
    setEmail("test@example.com");
    setPassword("password123");
    setMode("signin");
    setErrorMessage(null);
  };

  return (
    <div
      data-testid="auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-[#dadce0] shadow-xl w-full max-w-md overflow-hidden p-6 sm:p-8 space-y-6">
        {/* ヘッダー */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center mx-auto shadow-2xs">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#202124]">
            {mode === "signin" ? "アカウントにサインイン" : "新規アカウント作成"}
          </h2>
          <p className="text-xs text-[#5f6368]">
            LoLRankupLab はログインしたあなた専用の個人ランクアップ分析ツールです
          </p>
        </div>

        {/* タブ切り替え */}
        <div className="flex bg-[#f8f9fa] p-1 rounded-lg border border-[#dadce0] text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-semibold transition flex items-center justify-center gap-1.5 ${
              mode === "signin"
                ? "bg-white text-[#1a73e8] shadow-2xs"
                : "text-[#5f6368] hover:text-[#202124]"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            サインイン
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-semibold transition flex items-center justify-center gap-1.5 ${
              mode === "signup"
                ? "bg-white text-[#1a73e8] shadow-2xs"
                : "text-[#5f6368] hover:text-[#202124]"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            新規登録
          </button>
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
            <label className="text-xs font-semibold text-[#3c4043] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#5f6368]" />
              メールアドレス
            </label>
            <input
              type="email"
              data-testid="auth-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="summoner@example.com"
              required
              className="w-full text-xs bg-[#f8f9fa] border border-[#dadce0] rounded-lg px-3 py-2 outline-none focus:border-[#1a73e8] focus:bg-white transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#3c4043] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#5f6368]" />
              パスワード
            </label>
            <input
              type="password"
              data-testid="auth-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full text-xs bg-[#f8f9fa] border border-[#dadce0] rounded-lg px-3 py-2 outline-none focus:border-[#1a73e8] focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            data-testid="auth-submit-btn"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-lg transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "signin" ? (
              <>
                <LogIn className="w-4 h-4" />
                サインイン
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                アカウントを作成
              </>
            )}
          </button>
        </form>

        {/* 開発用デモユーザー簡単入力 */}
        <div className="pt-3 border-t border-[#f1f3f4] text-center">
          <button
            type="button"
            data-testid="demo-login-btn"
            onClick={handleFillDemoUser}
            className="text-[11px] text-[#1a73e8] hover:text-[#1557b0] hover:underline font-medium cursor-pointer"
          >
            開発用デモアカウント (test@example.com) を入力
          </button>
        </div>
      </div>
    </div>
  );
};

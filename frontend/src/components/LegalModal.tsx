"use client";

import React, { useEffect } from "react";
import { X, FileText, Shield, CheckCircle2 } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  activeTab: "terms" | "privacy";
  onTabChange: (tab: "terms" | "privacy") => void;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
}) => {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-[#dadce0] shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-[#202124]">
        {/* Header */}
        <div className="p-5 border-b border-[#dadce0] flex items-center justify-between bg-[#f8f9fa] shrink-0">
          <div className="flex items-center gap-2">
            {activeTab === "terms" ? (
              <FileText className="w-5 h-5 text-[#1a73e8]" />
            ) : (
              <Shield className="w-5 h-5 text-[#1a73e8]" />
            )}
            <h3 id="legal-modal-title" className="text-base font-bold text-[#202124]">
              {activeTab === "terms" ? "利用規約 (Terms of Service)" : "プライバシーポリシー (Privacy Policy)"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#e8eaed] rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#dadce0] bg-white px-5 pt-2 gap-4 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange("terms")}
            className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "terms"
                ? "border-[#1a73e8] text-[#1a73e8]"
                : "border-transparent text-[#5f6368] hover:text-[#202124]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>利用規約</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("privacy")}
            className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "privacy"
                ? "border-[#1a73e8] text-[#1a73e8]"
                : "border-transparent text-[#5f6368] hover:text-[#202124]"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>プライバシーポリシー</span>
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#3c4043] leading-relaxed">
          {activeTab === "terms" ? (
            <div className="space-y-4">
              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-[#202124]">第1条（総則と本ツールの位置づけ）</h4>
                <p>
                  LoL Rankup Lab（以下「本ツール」）は、League of Legendsのプレイヤーが自身の対戦履歴および対面相性を客観的に振り返り、プレイスキル向上を図るための個人専用学習支援ツールです。
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-[#202124]">第2条（アカウントおよび利用責任）</h4>
                <p>
                  利用者は自身の登録情報（メールアドレスおよびパスワード）を厳重に管理するものとします。本ツールは個人専用の分析ツールとして設計されており、自身の戦績および反省メモの蓄積以外の目的での利用はできません。
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-[#202124]">第3条（禁止事項）</h4>
                <ul className="list-disc pl-4 space-y-1 text-[#5f6368]">
                  <li>不正アクセス、クローリング、過度なAPIリクエスト等により本ツールのサーバーまたは第三者のインフラに負荷を与える行為</li>
                  <li>チートツール、不正自動操作、またはRiot Gamesの規約に反するツールと本ツールを連動させる行為</li>
                  <li>他の利用者または第三者の権利・プライバシーを侵害する行為</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-[#202124]">第4条（免責事項および非保証）</h4>
                <p>
                  本ツールはRiot Gamesの公式製品ではなく、提供される戦績・勝率・分析データ等の完全性や、利用者のランク・LP向上を保証するものではありません。Riot APIの一時的停止、仕様変更、通信障害等に起因するデータ取得遅延等について、運営者は一切の責任を負いません。
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-[#202124]">第5条（規約の変更およびサービスの終了）</h4>
                <p>
                  運営者は必要に応じて本規約の改定または本ツールの提供を一時停止・終了することがあります。
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Highlight Box */}
              <div className="p-3.5 bg-[#e8f0fe] rounded-xl border border-[#d2e3fc] flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
                <div className="text-xs text-[#1967d2] leading-relaxed">
                  <span className="font-bold">反省メモの完全秘匿について:</span>
                  <br />
                  あなたが記録した試合反省メモ（MatchNote）は、あなたのアカウントにのみ紐づき、完全に秘匿されます。他の利用者が同一のサモナーを検索・登録した場合でも、あなたの反省メモを閲覧・編集することは一切できません。
                </div>
              </div>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-[#202124]">1. 収集する情報</h4>
                <p>本ツールでは以下の情報を取得・保存します。</p>
                <ul className="list-disc pl-4 space-y-1 text-[#5f6368]">
                  <li>アカウント情報（メールアドレス、暗号化パスワード）</li>
                  <li>連携サモナー情報（Riot ID: ゲーム名・タグライン、PUUID）</li>
                  <li>公開戦績データ（Riot Games APIより取得した試合結果、参加者データ、タイムライン）</li>
                  <li>個人反省メモ（利用者が自発的に記録したメモ本文および対面難易度タグ）</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-[#202124]">2. 利用目的</h4>
                <p>
                  収集したデータは、利用者の過去対戦の可視化、14分時点の有利不利（Gold差・CS差）の客観的分析、苦手対面への対策レコメンド等、個人のランクアップ支援機能の提供にのみ利用します。
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-[#202124]">3. Cookieおよびローカルストレージ</h4>
                <p>
                  本ツールでは、ログイン状態の維持（認証トークン）のためにのみブラウザのローカルストレージおよびセッション機能を使用します。行動追跡広告や外部第三者によるトラッキングCookieは一切使用していません。
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-[#202124]">4. データ主体の権利（アカウント削除とデータ消去）</h4>
                <p>
                  利用者はいつでも自身のアカウント設定より「アカウント削除」を実行できます。アカウント削除が行われた場合、登録アカウント情報および作成されたすべての反省メモ（MatchNote）はデータベースから直ちに物理削除され、復元不可能となります。
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-sm font-bold text-[#202124]">5. Riot Games公式免責および知的財産</h4>
                <p className="text-[#5f6368]">
                  LoL Rankup Lab isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#dadce0] bg-[#f8f9fa] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#f1f3f4] text-[#202124] border border-[#dadce0] text-xs font-bold rounded-lg transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

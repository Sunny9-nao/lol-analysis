"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Edit3, Loader2, Sparkles, Check, Plus } from "lucide-react";
import { MatchParticipant } from "@/types/graphql";

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (participantId: string, content: string, matchupTag: string) => Promise<void>;
  participant: MatchParticipant | null;
  initialContent?: string;
  initialTag?: string | null;
}

const QUICK_FACTOR_TAGS = [
  { label: "Lv1-3ソロキル被弾", category: "lose" },
  { label: "ガンク被弾", category: "lose" },
  { label: "ウェーブ管理ミス", category: "lose" },
  { label: "スキルCDトレード負け", category: "lose" },
  { label: "リコール判断ミス", category: "lose" },
  { label: "集団戦寄り遅れ", category: "lose" },
  { label: "アイテム選択ミス", category: "lose" },
  { label: "序盤ソロキル成功", category: "win" },
  { label: "ウェーブフリーズ完封", category: "win" },
  { label: "ローム・集団戦貢献", category: "win" },
];

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  participant,
  initialContent = "",
  initialTag = "Hard",
}) => {
  const [content, setContent] = useState(initialContent);
  const [tag, setTag] = useState<string>(initialTag || "Hard");
  const [isSaving, setIsSaving] = useState(false);

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

  if (!isOpen || !participant) return null;

  const handleToggleChip = (chipLabel: string) => {
    const formatted = `【${chipLabel}】`;
    if (content.includes(formatted)) {
      // 既にあれば削除
      setContent(content.replace(formatted, "").trim());
    } else {
      // なければ先頭または末尾に追加
      setContent(content ? `${formatted} ${content}` : formatted);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(participant.id, content, tag);
      onClose();
    } catch (err) {
      alert(`保存に失敗しました: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const isWin = participant.win;
  const oppName = participant.opponentChampion?.name || participant.opponentChampionName || "対面";
  const myName = participant.champion?.name || participant.championName;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
      className="fixed inset-0 z-50 bg-[#202124]/40 flex items-center justify-center p-4 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl border border-[#dadce0] max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#dadce0] pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {participant.champion?.imageUrl && (
                <Image
                  src={participant.champion.imageUrl}
                  alt={myName}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-lg border border-[#dadce0] object-cover"
                />
              )}
              <span className="text-xs font-bold text-[#5f6368]">vs</span>
              {participant.opponentChampion?.imageUrl ? (
                <Image
                  src={participant.opponentChampion.imageUrl}
                  alt={oppName}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-lg border border-[#dadce0] object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-[#202124]">{oppName}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#202124] flex items-center gap-2">
                <span>{myName} vs {oppName}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isWin ? "bg-[#e8f0fe] text-[#1967d2]" : "bg-[#fce8e6] text-[#c5221f]"}`}>
                  {isWin ? "勝利" : "敗北"}
                </span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#5f6368] hover:text-[#202124] p-1 rounded-full hover:bg-[#f1f3f4] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matchup Tag Selector */}
        <div>
          <label className="block text-xs font-semibold text-[#5f6368] mb-1.5">対面難易度タグ</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTag("Hard")}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                tag === "Hard"
                  ? "border-[#fce8b2] bg-[#fef7e0] text-[#b06000] shadow-xs"
                  : "border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]"
              }`}
            >
              Hard (苦手・要警戒)
            </button>
            <button
              type="button"
              onClick={() => setTag("Even")}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                tag === "Even"
                  ? "border-[#dadce0] bg-[#f1f3f4] text-[#202124] shadow-xs"
                  : "border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]"
              }`}
            >
              Even (五分)
            </button>
            <button
              type="button"
              onClick={() => setTag("Easy")}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                tag === "Easy"
                  ? "border-[#b7e1cd] bg-[#e6f4ea] text-[#137333] shadow-xs"
                  : "border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]"
              }`}
            >
              Easy (有利・得意)
            </button>
          </div>
        </div>

        {/* Quick Factor Chips (ワンタップ入力) */}
        <div>
          <label className="block text-xs font-semibold text-[#5f6368] mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#1a73e8]" />
            クイック反省・勝敗要因 (タップでメモに追加)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_FACTOR_TAGS.map((chip) => {
              const isSelected = content.includes(`【${chip.label}】`);
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleToggleChip(chip.label)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
                    isSelected
                      ? "bg-[#1a73e8] border-[#1a73e8] text-white font-bold shadow-xs"
                      : "bg-[#f8f9fa] border-[#dadce0] text-[#3c4043] hover:bg-[#e8eaed]"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-[#5f6368]" />}
                    <span>{chip.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Note Content */}
        <div>
          <label className="block text-xs font-semibold text-[#5f6368] mb-1.5">反省・対策メモ本文</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full p-3 bg-[#f8f9fa] border border-[#dadce0] focus:border-[#1a73e8] focus:bg-white rounded-xl text-sm text-[#202124] outline-none transition placeholder-[#80868b]"
            placeholder="具体的な気付き（例: レベル2先行されて死んだ。相手がE使ったらトレードする等）をメモ..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-medium text-[#5f6368] hover:bg-[#f1f3f4] rounded-lg transition cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            メモを保存する
          </button>
        </div>
      </div>
    </div>
  );
};

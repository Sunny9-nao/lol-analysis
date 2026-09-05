"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Loader2, X, Trash2 } from "lucide-react";
import { fetchGraphQL, removeAuthToken, DELETE_ACCOUNT_MUTATION } from "@/lib/graphql-client";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const handleClose = useCallback(() => {
    if (loading) return;
    setConfirmText("");
    setErrorMessage(null);
    onClose();
  }, [loading, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      const data = await fetchGraphQL<{
        deleteAccount: { success: boolean; errors: string[] };
      }>(DELETE_ACCOUNT_MUTATION);

      if (data.deleteAccount.errors && data.deleteAccount.errors.length > 0) {
        setErrorMessage(data.deleteAccount.errors.join(", "));
        return;
      }

      if (data.deleteAccount.success) {
        removeAuthToken();
        onDeleted();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "アカウント削除処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const isConfirmed = confirmText === "アカウント削除";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) handleClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-[#dadce0] shadow-xl w-full max-w-md overflow-hidden text-[#202124]">
        {/* Header */}
        <div className="p-5 border-b border-[#dadce0] flex items-center justify-between bg-[#fce8e6] shrink-0">
          <div className="flex items-center gap-2 text-[#c5221f]">
            <AlertTriangle className="w-5 h-5" />
            <h3 id="delete-account-title" className="text-base font-bold">
              アカウントの完全削除
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="閉じる"
            className="p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-black/5 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs leading-relaxed text-[#3c4043]">
          <div className="p-3 bg-[#fef7e0] rounded-xl border border-[#fce8b2] text-[#b06000] space-y-1">
            <p className="font-bold">この操作は取り消せません</p>
            <p>
              アカウントを削除すると、これまで記録したすべての反省メモ（MatchNote）およびアカウント情報が直ちにデータベースから消去されます。
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#fce8e6] rounded-xl border border-[#fad2cf] text-[#c5221f]">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="confirm-delete-input" className="block text-[#202124] font-medium">
              確認のため、以下に <span className="font-bold text-[#c5221f]">アカウント削除</span> と入力してください：
            </label>
            <input
              id="confirm-delete-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="アカウント削除"
              disabled={loading}
              className="w-full px-3 py-2 border border-[#dadce0] rounded-lg focus:outline-hidden focus:border-[#d93025] focus:ring-1 focus:ring-[#d93025] transition"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#dadce0] bg-[#f8f9fa] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 bg-white hover:bg-[#f1f3f4] text-[#202124] border border-[#dadce0] text-xs font-bold rounded-lg transition disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            className="px-4 py-2 bg-[#d93025] hover:bg-[#b3261e] text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>完全に削除する</span>
          </button>
        </div>
      </div>
    </div>
  );
};

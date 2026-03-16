import { useEffect } from "react";
import type { CellDiff } from "../types/diff";

type Props = {
  cell: CellDiff;
  onClose: () => void;
};

function ValueBox({ label, value, color }: { label: string; value: string | null; color: string }) {
  if (value === null) return null;
  return (
    <div className={`rounded border ${color} p-3 flex-1 min-w-0`}>
      <p className={`text-xs font-semibold mb-1 ${color.replace("border-", "text-").replace("-300", "-700")}`}>
        {label}
      </p>
      <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-sans leading-relaxed text-left">
        {value || <span className="text-gray-400 italic">（空）</span>}
      </pre>
    </div>
  );
}

export default function CellDetailModal({ cell, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hasC = cell.c_value !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-gray-700">{cell.cell}</span>
            {cell.status === "conflict" && (
              <span className="text-xs bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded">
                コンフリクト
              </span>
            )}
            {cell.status !== "conflict" && cell.status !== "no_change" && (
              <span className="text-xs bg-gray-100 text-gray-600 border border-gray-300 px-2 py-0.5 rounded">
                {cell.status}
              </span>
            )}
            <span className="text-xs text-gray-400">{cell.type}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 内容 */}
        <div className="p-5 overflow-y-auto flex gap-3">
          <ValueBox label="Base（比較元）" value={cell.base_value} color="border-gray-300" />
          <ValueBox label="B（変更A）" value={cell.b_value} color="border-blue-300" />
          {hasC && <ValueBox label="C（変更B）" value={cell.c_value} color="border-green-300" />}
        </div>

        {/* フッター */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            閉じる（Esc）
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SheetTabs from "../components/SheetTabs";
import ShapesSection from "../components/ShapesSection";
import DiffGrid from "../components/DiffGrid";
import type { DiffReport, CellDiff } from "../types/diff";

export type FilterType = "all" | "conflict" | "b" | "c";

const FILTER_LABELS: { value: FilterType; label: string }[] = [
  { value: "all",      label: "すべて" },
  { value: "conflict", label: "⚠ 競合" },
  { value: "b",        label: "B の変更" },
  { value: "c",        label: "C の変更" },
];

export default function Report() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<DiffReport | null>(null);
  const [activeSheet, setActiveSheet] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reportId) return;
    (async () => {
      try {
        let res: Response;
        try {
          res = await fetch(`/api/reports/${reportId}`);
        } catch {
          throw new Error("サーバーに接続できません");
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.detail?.message ?? "レポートが見つかりません");
        }
        let data: DiffReport;
        try {
          data = await res.json();
        } catch (e) {
          console.error("レポートJSONパース失敗:", e);
          throw new Error("レポートの形式が正しくありません");
        }
        if (!data?.sheets || typeof data.sheets !== "object") {
          console.error("レポート構造不正:", data);
          throw new Error("レポートの形式が正しくありません");
        }
        setReport(data);
        setActiveSheet(Object.keys(data.sheets)[0] ?? "");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      }
    })();
  }, [reportId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate("/")} className="text-blue-600 underline text-sm">
            ホームへ戻る
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  const sheetData = report.sheets[activeSheet];
  const allCells: CellDiff[] = [
    ...(sheetData?.cells ?? []),
    ...(sheetData?.comments ?? []),
  ];

  const filteredCells = allCells.filter((c) => {
    if (filter === "conflict") return c.status === "conflict";
    if (filter === "b")        return c.changed_by === "b" || c.changed_by === "both";
    if (filter === "c")        return c.changed_by === "c" || c.changed_by === "both";
    return true;
  });

  return (
    <div className="min-h-screen bg-white flex flex-col text-sm">
      {/* ヘッダー */}
      <header className="bg-gray-900 text-white px-4 py-3 flex items-center gap-3 flex-wrap sticky top-0 z-20">
        <button onClick={() => navigate("/")} className="text-gray-400 hover:text-white text-xs">
          ← ホーム
        </button>
        <span className="text-gray-600">|</span>
        <span className="text-xs text-gray-300">
          <span className="text-yellow-400">base:</span> {report.meta.base_file}&ensp;
          <span className="text-blue-400">B:</span> {report.meta.file_b}
          {report.meta.file_c && <>&ensp;<span className="text-green-400">C:</span> {report.meta.file_c}</>}
        </span>
        <div className="ml-auto flex gap-2">
          <span className="bg-gray-700 text-xs px-2 py-0.5 rounded">差分 {report.meta.total_diffs}件</span>
          {report.meta.total_conflicts > 0 && (
            <span className="bg-red-600 text-xs px-2 py-0.5 rounded">競合 {report.meta.total_conflicts}件</span>
          )}
        </div>
      </header>

      {/* シートタブ */}
      <SheetTabs
        sheets={report.sheets}
        activeSheet={activeSheet}
        onSelect={(name) => { setActiveSheet(name); setFilter("all"); }}
      />

      {/* フィルターバー */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50 sticky top-[44px] z-10">
        {FILTER_LABELS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filter === value
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-2 text-xs text-gray-400">{filteredCells.length}件</span>

        {/* 凡例 */}
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-200 border border-orange-400 inline-block" />競合</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400 inline-block" />変更</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-400 inline-block" />新規</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-400 inline-block" />追記</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-400 inline-block" />削除</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-50 border border-red-300 inline-block" />末尾削除</span>
        </div>
      </div>

      {/* グリッド */}
      <div className="flex-1 p-4 overflow-auto">
        <DiffGrid cells={filteredCells} />
        {sheetData?.shapes && <ShapesSection shapes={sheetData.shapes} />}
      </div>
    </div>
  );
}

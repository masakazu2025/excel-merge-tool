import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SheetTabs from "../components/SheetTabs";
import ShapesSection from "../components/ShapesSection";
import DiffGrid from "../components/DiffGrid";
import type { DiffReport, CellDiff } from "../types/diff";

type FilterType = "all" | "conflict" | "review";

const FILTER_LABELS: { value: FilterType; label: string }[] = [
  { value: "all",      label: "すべて" },
  { value: "conflict", label: "コンフリクト" },
  { value: "review",   label: "要確認" },
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
    fetch(`/api/reports/${reportId}`)
      .then((r) => {
        if (!r.ok) throw new Error("レポートが見つかりません");
        return r.json();
      })
      .then((data: DiffReport) => {
        setReport(data);
        setActiveSheet(Object.keys(data.sheets)[0] ?? "");
      })
      .catch((e: Error) => setError(e.message));
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
    if (filter === "conflict") return c.conflict;
    if (filter === "review")   return c.review_required;
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
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-400 inline-block" />追加</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-400 inline-block" />削除</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-100 border border-purple-400 inline-block" />日付</span>
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

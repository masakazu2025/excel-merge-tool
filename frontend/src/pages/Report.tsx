import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SheetTabs from "../components/SheetTabs";
import FilterBar from "../components/FilterBar";
import CellDiffTable from "../components/CellDiffTable";
import ShapesSection from "../components/ShapesSection";
import type { DiffReport, CellDiff } from "../types/diff";

export type FilterType = "all" | "conflict" | "b" | "c" | "review";

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
  const allCellItems: CellDiff[] = [
    ...(sheetData?.cells ?? []),
    ...(sheetData?.comments ?? []),
  ];
  const filteredItems = allCellItems.filter((item) => {
    if (filter === "conflict") return item.conflict;
    if (filter === "b") return item.b_value != null && !item.conflict;
    if (filter === "c") return item.c_value != null && !item.conflict;
    if (filter === "review") return item.review_required;
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
          <span className="text-blue-400">B:</span> {report.meta.file_b}&ensp;
          <span className="text-green-400">C:</span> {report.meta.file_c}
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
      <FilterBar
        filter={filter}
        onFilter={setFilter}
        totalVisible={filteredItems.length}
      />

      {/* 差分テーブル */}
      <div className="flex-1">
        <CellDiffTable items={filteredItems} />
        {sheetData?.shapes && <ShapesSection shapes={sheetData.shapes} />}
      </div>
    </div>
  );
}

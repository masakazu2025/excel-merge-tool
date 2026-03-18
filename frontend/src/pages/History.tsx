import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { ReportSummary } from "../types/diff";

const LIMIT_OPTIONS = [10, 25, 50];
const COL_COUNT = 4;

type PagedResponse = {
  items: ReportSummary[];
  total: number;
  page: number;
  limit: number;
};

function formatDate(iso: string) {
  return iso.replace("T", " ").slice(0, 16);
}

export default function History() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cursorRow, setCursorRow] = useState(0);
  const [cursorCol, setCursorCol] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    (async () => {
      try {
        let res: Response;
        try {
          res = await fetch(`/api/reports?page=${page}&limit=${limit}`);
        } catch {
          throw new Error("サーバーに接続できません");
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.detail?.message ?? "履歴の取得に失敗しました");
        }
        const data: PagedResponse = await res.json();
        setReports(data.items ?? []);
        setTotal(data.total ?? 0);
        setCursorRow(0);
        setCursorCol(0);
        setTimeout(() => tableRef.current?.focus(), 0);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, limit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (reports.length === 0) return;
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setCursorRow((r) => Math.max(0, r - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setCursorRow((r) => Math.min(reports.length - 1, r + 1));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setCursorCol((c) => Math.max(0, c - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          setCursorCol((c) => Math.min(COL_COUNT - 1, c + 1));
          break;
        case "Enter":
          e.preventDefault();
          navigate(`/report/${reports[cursorRow].report_id}`);
          break;
      }
    },
    [reports, cursorRow, navigate]
  );

  const totalPages = Math.ceil(total / limit);

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1);
  }

  function tdClass(rowIdx: number, colIdx: number) {
    const focused = rowIdx === cursorRow && colIdx === cursorCol;
    return focused ? "ring-2 ring-inset ring-blue-500" : "";
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-xl font-bold text-gray-800 mb-6">比較履歴</h1>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : reports.length === 0 && page === 1 ? (
        <p className="text-sm text-gray-400">比較履歴がありません</p>
      ) : (
        <>
          <div
            ref={tableRef}
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e.nativeEvent)}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden outline-none focus:ring-2 focus:ring-blue-200"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">実行日時</th>
                  <th className="px-4 py-3 font-medium">比較元</th>
                  <th className="px-4 py-3 font-medium">変更ファイル</th>
                  <th className="px-4 py-3 font-medium text-right">差分件数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((r, rowIdx) => (
                  <tr
                    key={r.report_id}
                    onClick={() => navigate(`/report/${r.report_id}`)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td
                      data-row={rowIdx} data-col={0}
                      data-focused={rowIdx === cursorRow && 0 === cursorCol ? "true" : undefined}
                      className={`px-4 py-3 text-gray-700 whitespace-nowrap ${tdClass(rowIdx, 0)}`}
                    >
                      {formatDate(r.created_at)}
                    </td>
                    <td
                      data-row={rowIdx} data-col={1}
                      data-focused={rowIdx === cursorRow && 1 === cursorCol ? "true" : undefined}
                      className={`px-4 py-3 text-gray-700 max-w-[160px] truncate ${tdClass(rowIdx, 1)}`}
                      title={r.base_file}
                    >
                      {r.base_file}
                    </td>
                    <td
                      data-row={rowIdx} data-col={2}
                      data-focused={rowIdx === cursorRow && 2 === cursorCol ? "true" : undefined}
                      className={`px-4 py-3 text-gray-700 ${tdClass(rowIdx, 2)}`}
                    >
                      <div className="max-w-[200px]">
                        <p className="truncate" title={r.file_b}>{r.file_b}</p>
                        {r.file_c && <p className="truncate text-gray-500" title={r.file_c}>{r.file_c}</p>}
                      </div>
                    </td>
                    <td
                      data-row={rowIdx} data-col={3}
                      data-focused={rowIdx === cursorRow && 3 === cursorCol ? "true" : undefined}
                      className={`px-4 py-3 text-right ${tdClass(rowIdx, 3)}`}
                    >
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                        {r.total_diffs}件
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>{total}件中 {(page - 1) * limit + 1}〜{Math.min(page * limit, total)}件</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="ml-3 border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700"
              >
                {LIMIT_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}件表示</option>
                ))}
              </select>
            </div>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  前へ
                </button>
                <span className="px-3 py-1.5">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  次へ
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

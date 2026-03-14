import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ReportSummary } from "../types/diff";

const LIMIT_OPTIONS = [10, 25, 50];

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

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((data: PagedResponse) => {
        setReports(data.items);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, limit]);

  const totalPages = Math.ceil(total / limit);

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1);
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-xl font-bold text-gray-800 mb-6">比較履歴</h1>

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : reports.length === 0 && page === 1 ? (
        <p className="text-sm text-gray-400">比較履歴がありません</p>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                {reports.map((r) => (
                  <tr
                    key={r.report_id}
                    onClick={() => navigate(`/report/${r.report_id}`)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate" title={r.base_file}>
                      {r.base_file}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="max-w-[200px]">
                        <p className="truncate" title={r.file_b}>{r.file_b}</p>
                        {r.file_c && <p className="truncate text-gray-500" title={r.file_c}>{r.file_c}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
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

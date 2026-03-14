import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ReportSummary } from "../types/diff";

export default function ReportList() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportSummary[]>([]);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then(setReports)
      .catch(() => {});
  }, []);

  if (reports.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-700 mb-3">過去のレポート</h2>
      <ul className="divide-y divide-gray-100">
        {reports.map((r) => (
          <li key={r.report_id}>
            <button
              onClick={() => navigate(`/report/${r.report_id}`)}
              className="w-full text-left py-3 flex items-center gap-3 hover:bg-gray-50 px-1 rounded transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">
                  {r.base_file} / {r.file_b} / {r.file_c}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{r.created_at?.replace("T", " ").slice(0, 16)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{r.total_diffs}件</span>
                {r.total_conflicts > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded">競合 {r.total_conflicts}</span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

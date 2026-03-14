import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReportList from "../components/ReportList";

export default function Home() {
  const navigate = useNavigate();
  const baseRef = useRef<HTMLInputElement>(null);
  const bRef = useRef<HTMLInputElement>(null);
  const cRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCompare() {
    const base = baseRef.current?.files?.[0];
    const b = bRef.current?.files?.[0];
    const c = cRef.current?.files?.[0];
    if (!base || !b || !c) {
      setError("3つのファイルを選択してください");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("base_file", base);
      form.append("file_b", b);
      form.append("file_c", c);
      const res = await fetch("/api/compare", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      navigate(`/report/${data.report_id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Excel 差分比較ツール</h1>
        <p className="text-gray-500 text-sm mb-8">3つのExcelファイルを比較して差分を確認します</p>

        {/* アップロードフォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">ファイルを選択</h2>
          <div className="space-y-4">
            <FileInput label="マージ元 (base)" ref={baseRef} />
            <FileInput label="ファイル B" ref={bRef} />
            <FileInput label="ファイル C" ref={cRef} />
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleCompare}
            disabled={loading}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? "比較中..." : "比較実行"}
          </button>
        </div>

        {/* 過去レポート */}
        <ReportList />
      </div>
    </div>
  );
}

const FileInput = ({ label, ref }: { label: string; ref: React.Ref<HTMLInputElement> }) => (
  <div className="flex items-center gap-3">
    <span className="w-36 text-sm text-gray-600 shrink-0">{label}</span>
    <input
      ref={ref}
      type="file"
      accept=".xlsx"
      className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
    />
  </div>
);

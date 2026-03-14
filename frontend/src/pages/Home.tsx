import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FileSelectionList, { type SelectedFile } from "../components/FileSelectionList";
import ReportList from "../components/ReportList";

let nextId = 0;

export default function Home() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [baseId, setBaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleAdd(incoming: File[]) {
    setFiles((prev) => {
      const added = incoming.map((file) => ({ id: String(nextId++), file }));
      const next = [...prev, ...added];
      if (baseId === null) setBaseId(added[0].id);
      return next;
    });
  }

  function handleRemove(id: string) {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (id === baseId) {
        setBaseId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  }

  function handleBaseChange(id: string) {
    setBaseId(id);
  }

  async function handleCompare() {
    if (!baseId || files.length < 2) return;
    const baseFile = files.find((f) => f.id === baseId)!;
    const others = files.filter((f) => f.id !== baseId);

    setError("");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("base_file", baseFile.file);
      form.append("file_b", others[0].file);
      if (others[1]) form.append("file_c", others[1].file);

      // TODO: モック - 実際のAPI呼び出しに置き換える
      console.log("compare", { base: baseFile.file.name, others: others.map((o) => o.file.name) });
      await new Promise((r) => setTimeout(r, 800));
      navigate("/report/mock");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  const canCompare = files.length >= 2 && baseId !== null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Excel 差分比較ツール</h1>
        <p className="text-gray-500 text-sm mb-8">Excelファイルを比較して差分を確認します</p>

        {/* ファイル選択 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">ファイルを選択</h2>
          <FileSelectionList
            files={files}
            baseId={baseId}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onBaseChange={handleBaseChange}
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleCompare}
            disabled={!canCompare || loading}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
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

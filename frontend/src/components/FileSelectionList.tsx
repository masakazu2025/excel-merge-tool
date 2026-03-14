import { useRef, useState } from "react";

export type SelectedFile = {
  id: string;
  file: File;
};

type Props = {
  files: SelectedFile[];
  baseId: string | null;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onBaseChange: (id: string) => void;
};

const ACCEPT_EXTS = [".xlsx", ".xlsm"];

function isAccepted(file: File) {
  return ACCEPT_EXTS.some((ext) => file.name.endsWith(ext));
}

export default function FileSelectionList({ files, baseId, onAdd, onRemove, onBaseChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    const accepted = Array.from(incoming).filter(isAccepted);
    if (accepted.length > 0) onAdd(accepted);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      {/* ドロップゾーン */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
          dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-300"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <p className="text-sm text-gray-500">
          ここにドロップ または{" "}
          <span className="text-blue-600 font-medium">ファイルを選択</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">.xlsx / .xlsm 形式 / 複数選択可</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xlsm"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {/* ファイルリスト */}
      {files.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {files.map((item) => {
            const isBase = item.id === baseId;
            return (
              <div
                key={item.id}
                onClick={() => onBaseChange(item.id)}
                className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {/* カスタムラジオ */}
                <div className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isBase ? "border-blue-600 bg-blue-600" : "border-gray-400 bg-white"
                }`}>
                  {isBase && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>

                {/* ファイル名 */}
                <span
                  className="flex-1 text-sm text-gray-700 truncate"
                  title={item.file.name}
                >
                  📄 {item.file.name}
                </span>

                {/* 比較元バッジ */}
                {isBase && (
                  <span className="shrink-0 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    比較元
                  </span>
                )}

                {/* 削除ボタン */}
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                  className="shrink-0 text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                  title="削除"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

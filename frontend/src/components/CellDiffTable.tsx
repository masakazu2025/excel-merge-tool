import { useState } from "react";
import type { CellDiff, CellStatus, CellType } from "../types/diff";

const STATUS_STYLES: Record<CellStatus, { label: string; cls: string }> = {
  new:       { label: "新規",     cls: "text-green-600" },
  add:       { label: "追記",     cls: "text-blue-600" },
  sub:       { label: "末尾削除", cls: "text-orange-500" },
  delete:    { label: "削除",     cls: "text-red-600" },
  update:    { label: "変更",     cls: "text-orange-500" },
  conflict:  { label: "競合",     cls: "text-red-600" },
  no_change: { label: "変更なし", cls: "text-gray-400" },
};

const TYPE_LABELS: Record<CellType, string> = {
  value: "値",
  formula: "数式",
  rich_text: "リッチテキスト",
  comment: "コメント",
  date: "日付",
};

function StatusBadge({ status }: { status: CellStatus }) {
  if (status === "conflict") return <span className="text-red-600 font-medium text-xs">⚠ 競合</span>;
  const { label, cls } = STATUS_STYLES[status] ?? { label: status, cls: "" };
  return <span className={`text-xs ${cls}`}>{label}</span>;
}

function DiffRow({ item }: { item: CellDiff }) {
  const [conflictChoice, setConflictChoice] = useState<"B" | "C" | null>(null);

  return (
    <>
      <tr className={item.status === "conflict" ? "bg-amber-50" : "hover:bg-gray-50"}>
        <td className="px-3 py-2 font-mono text-xs text-gray-700">{item.cell}</td>
        <td className="px-3 py-2">
          <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">{TYPE_LABELS[item.type]}</span>
        </td>
        <td className="px-3 py-2 font-mono text-xs text-gray-400 max-w-[180px] truncate" title={item.base_value ?? ""}>
          {item.base_value || <span className="text-gray-300 italic">空</span>}
        </td>
        <td className="px-3 py-2 font-mono text-xs text-blue-700 max-w-[180px] truncate" title={item.b_value ?? ""}>
          {item.b_value ?? <span className="text-gray-300">-</span>}
        </td>
        <td className="px-3 py-2 font-mono text-xs text-green-700 max-w-[180px] truncate" title={item.c_value ?? ""}>
          {item.c_value ?? <span className="text-gray-300">-</span>}
        </td>
        <td className="px-3 py-2">
          <StatusBadge status={item.status} />
        </td>
      </tr>
      {item.status === "conflict" && (
        <tr className="bg-amber-50 border-b border-amber-100">
          <td></td>
          <td colSpan={5} className="px-3 pb-2">
            <div className="flex items-center gap-4">
              <span className="text-xs text-red-600 font-medium">どちらを採用しますか？</span>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="radio"
                  name={`conflict-${item.id}`}
                  checked={conflictChoice === "B"}
                  onChange={() => setConflictChoice("B")}
                  className="text-blue-600"
                />
                <span className="text-blue-700 font-medium">B採用:</span>
                <code className="bg-blue-50 px-1.5 py-0.5 rounded">{item.b_value}</code>
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="radio"
                  name={`conflict-${item.id}`}
                  checked={conflictChoice === "C"}
                  onChange={() => setConflictChoice("C")}
                  className="text-green-600"
                />
                <span className="text-green-700 font-medium">C採用:</span>
                <code className="bg-green-50 px-1.5 py-0.5 rounded">{item.c_value}</code>
              </label>
              {!conflictChoice && <span className="text-red-400 text-xs">← 未解決</span>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

interface Props {
  items: CellDiff[];
}

export default function CellDiffTable({ items }: Props) {
  if (items.length === 0) {
    return <p className="px-4 py-6 text-sm text-gray-400">該当する差分はありません</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-left">
            <th className="px-3 py-2 text-xs font-medium text-gray-500">セル</th>
            <th className="px-3 py-2 text-xs font-medium text-gray-500">種別</th>
            <th className="px-3 py-2 text-xs font-medium text-gray-500">現在値（base）</th>
            <th className="px-3 py-2 text-xs font-medium text-blue-500">Bの値</th>
            <th className="px-3 py-2 text-xs font-medium text-green-500">Cの値</th>
            <th className="px-3 py-2 text-xs font-medium text-gray-500">状態</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <DiffRow key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

import type { FilterType } from "../pages/Report";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "全て" },
  { key: "conflict", label: "⚠ 競合のみ" },
  { key: "b", label: "Bの変更" },
  { key: "c", label: "Cの変更" },
  { key: "review", label: "要確認" },
];

interface Props {
  filter: FilterType;
  onFilter: (f: FilterType) => void;
  totalVisible: number;
}

export default function FilterBar({ filter, onFilter, totalVisible }: Props) {
  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500 mr-1">フィルター:</span>
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onFilter(f.key)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            filter === f.key
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
          }`}
        >
          {f.label}
        </button>
      ))}
      <span className="ml-auto text-xs text-gray-400">{totalVisible}件表示</span>
    </div>
  );
}

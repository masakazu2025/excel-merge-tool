import type { SheetDiff } from "../types/diff";

function countDiffs(sheet: SheetDiff): number {
  return (sheet.cells?.length ?? 0) + (sheet.comments?.length ?? 0);
}

function hasConflict(sheet: SheetDiff): boolean {
  return (
    (sheet.cells ?? []).some((c) => c.conflict) ||
    (sheet.comments ?? []).some((c) => c.conflict) ||
    (sheet.shapes?.matched ?? []).some((m) => m.conflict)
  );
}

interface Props {
  sheets: Record<string, SheetDiff>;
  activeSheet: string;
  onSelect: (name: string) => void;
}

export default function SheetTabs({ sheets, activeSheet, onSelect }: Props) {
  return (
    <div className="border-b border-gray-200 bg-white px-3 pt-1 sticky top-[52px] z-10 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {Object.entries(sheets).map(([name, sheet]) => {
          const count = countDiffs(sheet);
          const conflict = hasConflict(sheet);
          const active = name === activeSheet;
          return (
            <button
              key={name}
              onClick={() => onSelect(name)}
              className={`px-3 py-2 text-sm border-b-2 whitespace-nowrap transition-colors ${
                active
                  ? "border-blue-600 text-blue-600 font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {name}
              {count > 0 && (
                <span className="ml-1.5 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">{count}</span>
              )}
              {conflict && <span className="ml-1 text-red-500 text-xs">⚠</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

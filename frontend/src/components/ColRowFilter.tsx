import { useEffect, useRef, useState } from "react";

interface Props {
  label: string;
  items: string[];
  excluded: Set<string>;
  onChange: (excluded: Set<string>) => void;
}

export default function ColRowFilter({ label, items, excluded, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const lastClickedIndex = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const excludedCount = items.filter((item) => excluded.has(item)).length;
  const isActive = excludedCount > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(item: string, index: number, shiftKey: boolean) {
    const next = new Set(excluded);
    const newChecked = excluded.has(item); // currently excluded → clicking = re-include

    if (shiftKey && lastClickedIndex.current !== null) {
      const from = Math.min(lastClickedIndex.current, index);
      const to = Math.max(lastClickedIndex.current, index);
      for (let i = from; i <= to; i++) {
        if (newChecked) next.delete(items[i]);
        else next.add(items[i]);
      }
    } else {
      if (excluded.has(item)) next.delete(item);
      else next.add(item);
    }

    lastClickedIndex.current = index;
    onChange(next);
  }

  function selectAll() {
    onChange(new Set());
    lastClickedIndex.current = null;
  }

  function deselectAll() {
    onChange(new Set(items));
    lastClickedIndex.current = null;
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ${
          isActive
            ? "bg-orange-100 border border-orange-400 text-orange-700 hover:bg-orange-200"
            : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
        }`}
      >
        {isActive ? `${label} ${excludedCount}除外 ▾` : `${label} ▾`}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[120px]">
          <div className="px-3 py-2 text-xs text-gray-500 border-b">
            表示する{label}
          </div>
          <div className="flex gap-2 px-3 py-1.5 border-b">
            <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">
              すべて選択
            </button>
            <span className="text-gray-300">|</span>
            <button onClick={deselectAll} className="text-xs text-blue-600 hover:underline">
              すべて解除
            </button>
          </div>
          {items.map((item, index) => (
            <label
              key={item}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs"
              onClick={(e) => {
                e.preventDefault();
                toggle(item, index, e.shiftKey);
              }}
            >
              <input
                type="checkbox"
                aria-label={item}
                checked={!excluded.has(item)}
                readOnly
                className="accent-blue-600 pointer-events-none"
              />
              {item}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

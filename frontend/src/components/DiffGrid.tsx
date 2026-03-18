import { useCallback, useEffect, useRef, useState } from "react";
import type { CellDiff } from "../types/diff";
import CellDetailModal from "./CellDetailModal";
import ColRowFilter from "./ColRowFilter";

type Props = {
  cells: CellDiff[];
  hasFileC?: boolean;
  sheetKey?: string;
};

// "B4" → { col: "B", row: 4 }
function parseCell(cell: string): { col: string; row: number } | null {
  const m = cell.match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  return { col: m[1], row: parseInt(m[2], 10) };
}

// "AB" → 28 (for sorting)
function colToNum(col: string): number {
  let n = 0;
  for (const c of col) n = n * 26 + (c.charCodeAt(0) - 64);
  return n;
}

function cellBg(diff: CellDiff): string {
  switch (diff.status) {
    case "conflict": return "bg-orange-200 border-orange-400";
    case "new":      return "bg-green-100 border-green-400";
    case "add":      return "bg-blue-100 border-blue-400";
    case "delete":   return "bg-red-100 border-red-400";
    case "sub":      return "bg-red-50 border-red-300";
    default:         return "bg-yellow-100 border-yellow-400"; // update
  }
}

function displayValue(diff: CellDiff): string {
  // B値を優先表示。Bが変更なし(b_value = base_value)でもb_valueに実値が入っている
  return diff.b_value ?? diff.base_value ?? "";
}

export default function DiffGrid({ cells, hasFileC = false, sheetKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [modalCell, setModalCell] = useState<CellDiff | null>(null);

  // ズーム
  const [zoom, setZoom] = useState(100);
  const MIN_ZOOM = 50;
  const MAX_ZOOM = 100;
  const ZOOM_STEP = 10;

  function handleWheel(e: React.WheelEvent) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom((prev) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)))
    );
  }

  // 自前ダブルクリック検出（ブラウザの onDoubleClick より確実）
  const lastClickRef = useRef<{ key: string; time: number } | null>(null);
  const DBLCLICK_MS = 400;

  function handleHeaderClick(key: string, onDblClick: () => void) {
    const now = Date.now();
    if (lastClickRef.current?.key === key && now - lastClickRef.current.time < DBLCLICK_MS) {
      lastClickRef.current = null;
      onDblClick();
    } else {
      lastClickRef.current = { key, time: now };
    }
  }

  // Per-sheet filter state
  type FilterState = { cols: Set<string>; rows: Set<string> };
  const filtersBySheet = useRef(new Map<string, FilterState>());
  const [excludedCols, setExcludedCols] = useState(new Set<string>());
  const [excludedRows, setExcludedRows] = useState(new Set<string>());

  // Restore filter state when sheetKey changes
  useEffect(() => {
    const key = sheetKey ?? "";
    const saved = filtersBySheet.current.get(key);
    setExcludedCols(saved?.cols ?? new Set());
    setExcludedRows(saved?.rows ?? new Set());
  }, [sheetKey]);

  // Save filter state when it changes
  useEffect(() => {
    filtersBySheet.current.set(sheetKey ?? "", { cols: excludedCols, rows: excludedRows });
  }, [sheetKey, excludedCols, excludedRows]);

  const hasAnyFilter = excludedCols.size > 0 || excludedRows.size > 0;

  // Parse and index cells
  const parsed = cells
    .map((d) => {
      if (!d?.cell) {
        console.error("不正なセルデータをスキップ:", d);
        return null;
      }
      return { diff: d, pos: parseCell(d.cell) };
    })
    .filter((x): x is { diff: CellDiff; pos: { col: string; row: number } } =>
      x !== null && x.pos !== null
    );

  // Dropdown items: mutual filtering
  const colsForDropdown = [...new Set(
    parsed.filter((x) => !excludedRows.has(String(x.pos.row))).map((x) => x.pos.col)
  )].sort((a, b) => colToNum(a) - colToNum(b));

  const rowsForDropdown = [...new Set(
    parsed.filter((x) => !excludedCols.has(x.pos.col)).map((x) => String(x.pos.row))
  )].sort((a, b) => Number(a) - Number(b));

  const effectiveExcludedCols = new Set([...excludedCols].filter((c) => colsForDropdown.includes(c)));
  const effectiveExcludedRows = new Set([...excludedRows].filter((r) => rowsForDropdown.includes(r)));

  // Apply col/row filter
  const filteredParsed = parsed.filter(
    (x) => !effectiveExcludedCols.has(x.pos.col) && !effectiveExcludedRows.has(String(x.pos.row))
  );

  const uniqueRows = [...new Set(filteredParsed.map((x) => x.pos.row))].sort((a, b) => a - b);
  const uniqueCols = [...new Set(filteredParsed.map((x) => x.pos.col))].sort(
    (a, b) => colToNum(a) - colToNum(b)
  );

  // cellMap: "row-col" → CellDiff
  const cellMap = new Map<string, CellDiff>();
  for (const { diff, pos } of filteredParsed) {
    cellMap.set(`${pos.row}-${pos.col}`, diff);
  }

  // Ordered list of all changed cell keys (row-major order)
  const orderedKeys = uniqueRows.flatMap((row) =>
    uniqueCols.filter((col) => cellMap.has(`${row}-${col}`)).map((col) => `${row}-${col}`)
  );

  const navigate = useCallback(
    (dir: "up" | "down" | "left" | "right") => {
      if (!focusedId && orderedKeys.length > 0) {
        const key = orderedKeys[0];
        const [r, c] = key.split("-");
        setFocusedId(key);
        setModalCell(cellMap.get(`${r}-${c}`) ?? null);
        return;
      }
      if (!focusedId) return;

      const [curRowStr, curCol] = focusedId.split("-");
      const curRow = parseInt(curRowStr, 10);
      const curColNum = colToNum(curCol);

      if (dir === "right" || dir === "left") {
        // 同じ行内で変更セルを移動
        const rowCols = uniqueCols.filter((c) => cellMap.has(`${curRow}-${c}`));
        const idx = rowCols.indexOf(curCol);
        const nextCol = dir === "right" ? rowCols[idx + 1] : rowCols[idx - 1];
        if (!nextCol) return;
        const key = `${curRow}-${nextCol}`;
        setFocusedId(key);
        setModalCell(cellMap.get(key) ?? null);
      } else {
        // 上下: 次の行へ移動し、現在の列に最も近い変更セルへスナップ
        const targetRows = dir === "down"
          ? uniqueRows.filter((r) => r > curRow)
          : uniqueRows.filter((r) => r < curRow).reverse();
        for (const targetRow of targetRows) {
          const rowCols = uniqueCols.filter((c) => cellMap.has(`${targetRow}-${c}`));
          if (rowCols.length === 0) continue;
          // 現在の列番号に最も近い列を選ぶ
          const nearest = rowCols.reduce((best, c) =>
            Math.abs(colToNum(c) - curColNum) < Math.abs(colToNum(best) - curColNum) ? c : best
          );
          const key = `${targetRow}-${nearest}`;
          setFocusedId(key);
          setModalCell(cellMap.get(key) ?? null);
          return;
        }
      }
    },
    [focusedId, uniqueRows, uniqueCols, cellMap, orderedKeys]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const dirMap: Record<string, "up" | "down" | "left" | "right"> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      };
      const dir = dirMap[e.key];
      if (!dir) return;
      e.preventDefault();
      navigate(dir);
    },
    [navigate]
  );

  // モーダルが開いているときだけキーを有効にする
  useEffect(() => {
    if (!modalCell) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalCell, handleKeyDown]);

  // Scroll focused cell into view
  useEffect(() => {
    if (!focusedId) return;
    containerRef.current?.querySelector(`[data-key="${focusedId}"]`)?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [focusedId]);

  if (cells.length === 0) {
    return <p className="text-sm text-gray-400 p-4">差分なし</p>;
  }

  return (
    <>
    {modalCell && <CellDetailModal cell={modalCell} onClose={() => setModalCell(null)} hasFileC={hasFileC} />}
    <div className="flex flex-col h-full w-full">
      {/* Col/Row フィルタバー */}
      <div className="flex items-center gap-2 px-2 py-1 border-b border-gray-200 bg-gray-50 shrink-0">
        <ColRowFilter
          label="列"
          items={colsForDropdown}
          excluded={effectiveExcludedCols}
          onChange={(s) => setExcludedCols(new Set(s))}
        />
        <ColRowFilter
          label="行"
          items={rowsForDropdown}
          excluded={effectiveExcludedRows}
          onChange={(s) => setExcludedRows(new Set(s))}
        />
        {hasAnyFilter && (
          <button
            onClick={() => { setExcludedCols(new Set()); setExcludedRows(new Set()); }}
            className="px-3 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            すべて解除
          </button>
        )}
        {zoom < MAX_ZOOM && (
          <button
            onClick={() => setZoom(100)}
            className="ml-auto px-2 py-0.5 rounded text-xs text-gray-500 bg-gray-200 hover:bg-gray-300"
          >
            {zoom}%
          </button>
        )}
      </div>
      {/* グリッド */}
      <div
        ref={containerRef}
        tabIndex={0}
        data-testid="diff-grid"
        onWheel={handleWheel}
        className="overflow-scroll flex-1 outline-none focus:ring-2 focus:ring-blue-300 rounded"
      >
        <div style={{ zoom: `${zoom}%` }}>
        <table className="border-collapse text-xs select-none">
          <thead>
            <tr>
              {/* 行番号列ヘッダー */}
              <th className="w-12 min-w-[3rem] bg-gray-100 border border-gray-300 px-2 py-1 text-gray-500 font-normal sticky left-0 z-10" />
              {uniqueCols.map((col) => (
                <th
                  key={col}
                  data-col={col}
                  onClick={() => handleHeaderClick(`col-${col}`, () => setExcludedCols((prev) => new Set([...prev, col])))}
                  className="min-w-[6rem] bg-gray-100 border border-gray-300 px-2 py-1 text-center text-gray-600 font-medium cursor-pointer select-none"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueRows.map((row) => (
              <tr key={row}>
                {/* 行番号 */}
                <td
                  data-row={String(row)}
                  onClick={() => handleHeaderClick(`row-${row}`, () => setExcludedRows((prev) => new Set([...prev, String(row)])))}
                  className="bg-gray-100 border border-gray-300 px-2 py-1 text-center text-gray-500 sticky left-0 z-10 font-medium cursor-pointer select-none"
                >
                  {row}
                </td>
                {uniqueCols.map((col) => {
                  const key = `${row}-${col}`;
                  const diff = cellMap.get(key);
                  const isFocused = focusedId === key;
                  if (!diff) {
                    return (
                      <td key={col} className="border border-gray-200 px-2 py-1 bg-white text-gray-300">
                        &nbsp;
                      </td>
                    );
                  }
                  return (
                    <td
                      key={col}
                      data-key={key}
                      onClick={() => { setFocusedId(key); setModalCell(diff); }}
                      className={`border px-2 py-1 cursor-pointer truncate max-w-[10rem] ${cellBg(diff)} ${
                        isFocused ? "ring-2 ring-inset ring-blue-500" : ""
                      }`}
                      title={displayValue(diff)}
                    >
                      {displayValue(diff) || <span className="text-gray-400 italic">（空）</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
    </>
  );
}

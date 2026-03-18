import { useCallback, useEffect, useRef, useState } from "react";
import type { CellDiff } from "../types/diff";
import CellDetailModal from "./CellDetailModal";

type Props = {
  cells: CellDiff[];
  hasFileC?: boolean;
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

export default function DiffGrid({ cells, hasFileC = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [modalCell, setModalCell] = useState<CellDiff | null>(null);

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

  const uniqueRows = [...new Set(parsed.map((x) => x.pos.row))].sort((a, b) => a - b);
  const uniqueCols = [...new Set(parsed.map((x) => x.pos.col))].sort(
    (a, b) => colToNum(a) - colToNum(b)
  );

  // cellMap: "row-col" → CellDiff
  const cellMap = new Map<string, CellDiff>();
  for (const { diff, pos } of parsed) {
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
    <div
      ref={containerRef}
      tabIndex={0}
      data-testid="diff-grid"
      className="overflow-scroll h-full w-full outline-none focus:ring-2 focus:ring-blue-300 rounded"
    >
      <table className="border-collapse text-xs select-none">
        <thead>
          <tr>
            {/* 行番号列ヘッダー */}
            <th className="w-12 min-w-[3rem] bg-gray-100 border border-gray-300 px-2 py-1 text-gray-500 font-normal sticky left-0 z-10" />
            {uniqueCols.map((col) => (
              <th
                key={col}
                className="min-w-[6rem] bg-gray-100 border border-gray-300 px-2 py-1 text-center text-gray-600 font-medium"
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
              <td className="bg-gray-100 border border-gray-300 px-2 py-1 text-center text-gray-500 sticky left-0 z-10 font-medium">
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
    </>
  );
}

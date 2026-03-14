import { useState } from "react";
import type { ShapeDiff, ShapeKind } from "../types/diff";

const KIND_LABELS: Record<ShapeKind, string> = {
  sp: "テキストボックス",
  pic: "画像",
  graphicFrame: "グラフ",
};

interface ShapeRow {
  id: string;
  name: string;
  kind: ShapeKind;
  status: string;
  statusCls: string;
}

function buildRows(shapes: ShapeDiff): ShapeRow[] {
  const rows: ShapeRow[] = [];
  for (const m of shapes.matched ?? []) {
    if (m.b_text || m.c_text) {
      rows.push({ id: `m-${m.id}`, name: m.name, kind: m.kind, status: "テキスト変更", statusCls: "bg-amber-100 text-amber-700" });
    }
  }
  for (const s of shapes.added_b ?? []) {
    rows.push({ id: `ab-${s.id}`, name: s.name, kind: s.kind, status: "B追加", statusCls: "bg-green-100 text-green-700" });
  }
  for (const s of shapes.added_c ?? []) {
    rows.push({ id: `ac-${s.id}`, name: s.name, kind: s.kind, status: "C追加", statusCls: "bg-green-100 text-green-700" });
  }
  for (const s of shapes.deleted_b ?? []) {
    rows.push({ id: `db-${s.id}`, name: s.name, kind: s.kind, status: "B削除", statusCls: "bg-red-100 text-red-700" });
  }
  for (const s of shapes.deleted_c ?? []) {
    rows.push({ id: `dc-${s.id}`, name: s.name, kind: s.kind, status: "C削除", statusCls: "bg-red-100 text-red-700" });
  }
  return rows;
}

interface Props {
  shapes: ShapeDiff;
}

export default function ShapesSection({ shapes }: Props) {
  const [open, setOpen] = useState(true);
  const rows = buildRows(shapes);

  if (rows.length === 0) return null;

  return (
    <div className="mt-4 mx-4 mb-4 border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
      >
        <span className="text-gray-400 text-xs">{open ? "▼" : "▶"}</span>
        <span className="text-sm font-medium text-gray-700">図形・画像・グラフ差分</span>
        <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{rows.length}件</span>
      </button>
      {open && (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-t border-gray-200 text-left">
              <th className="px-4 py-2 text-xs font-medium text-gray-500">図形名</th>
              <th className="px-4 py-2 text-xs font-medium text-gray-500">種別</th>
              <th className="px-4 py-2 text-xs font-medium text-gray-500">状態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-700">{row.name}</td>
                <td className="px-4 py-2">
                  <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">{KIND_LABELS[row.kind]}</span>
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${row.statusCls}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

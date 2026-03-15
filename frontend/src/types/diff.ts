export type CellStatus = "new" | "delete" | "add" | "sub" | "update" | "conflict" | "no_change";
export type ChangedBy = "b" | "c" | "both" | null;
export type CellType = "value" | "formula" | "rich_text" | "comment" | "date";
export type ShapeKind = "sp" | "pic" | "graphicFrame";

export interface CellDiff {
  id: string;
  cell: string;
  base_value: string | null;
  b_value: string | null;
  c_value: string | null;
  type: CellType;
  changed_by: ChangedBy;
  status: CellStatus;
}

export interface ShapeMatched {
  id: string;
  kind: ShapeKind;
  name: string;
  base_text: string | null;
  b_text: string | null;
  c_text: string | null;
  changed_by: ChangedBy;
  status: CellStatus;
}

export interface ShapeItem {
  id: string;
  kind: ShapeKind;
  name: string;
}

export interface ShapeDiff {
  matched: ShapeMatched[];
  added_b: ShapeItem[];
  added_c: ShapeItem[];
  deleted_b: ShapeItem[];
  deleted_c: ShapeItem[];
}

export interface SheetDiff {
  cells: CellDiff[];
  comments: CellDiff[];
  shapes: ShapeDiff;
}

export interface DiffMeta {
  created_at: string;
  base_file: string;
  file_b: string;
  file_c: string;
  total_diffs: number;
  total_conflicts: number;
}

export interface DiffReport {
  meta: DiffMeta;
  sheets: Record<string, SheetDiff>;
}

export interface ReportSummary {
  report_id: string;
  created_at: string;
  base_file: string;
  file_b: string;
  file_c: string;
  total_diffs: number;
  total_conflicts: number;
}

"""
B-037 動作確認用サンプルExcel生成スクリプト
- 行1がヘッダー行（列名の確認用）
- A列が商品IDなど（行名の確認用）
- base と file_b の差分で比較できる
"""
import io
import sys
import zipfile
import re
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent


def make_xlsx(sheets: dict[str, dict[str, str]]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        sheet_names = list(sheets.keys())

        ct_parts = "\n".join(
            f'<Override PartName="/xl/worksheets/sheet{i+1}.xml" '
            f'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            for i in range(len(sheet_names))
        )
        zf.writestr("[Content_Types].xml", f"""<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  {ct_parts}
</Types>""")

        zf.writestr("_rels/.rels", """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="xl/workbook.xml"/>
</Relationships>""")

        rels = "\n".join(
            f'<Relationship Id="rId{i+1}" '
            f'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
            f'Target="worksheets/sheet{i+1}.xml"/>'
            for i in range(len(sheet_names))
        )
        zf.writestr("xl/_rels/workbook.xml.rels", f"""<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {rels}
</Relationships>""")

        sheet_elems = "\n".join(
            f'<sheet name="{name}" sheetId="{i+1}" r:id="rId{i+1}"/>'
            for i, name in enumerate(sheet_names)
        )
        zf.writestr("xl/workbook.xml", f"""<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>{sheet_elems}</sheets>
</workbook>""")

        for i, (sheet_name, cells) in enumerate(sheets.items()):
            rows: dict[int, list] = {}
            for coord, val in cells.items():
                m = re.match(r"([A-Z]+)(\d+)", coord)
                if not m:
                    continue
                row = int(m.group(2))
                rows.setdefault(row, []).append((coord, val))

            row_elems = ""
            for row_num in sorted(rows):
                cell_elems = ""
                for coord, val in rows[row_num]:
                    cell_elems += f'<c r="{coord}" t="inlineStr"><is><t>{val}</t></is></c>'
                row_elems += f'<row r="{row_num}">{cell_elems}</row>'

            zf.writestr(f"xl/worksheets/sheet{i+1}.xml", f"""<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>{row_elems}</sheetData>
</worksheet>""")

    return buf.getvalue()


# ---------------------------------------------------------------------------
# 商品マスタシート定義
# ---------------------------------------------------------------------------
# 行1: ヘッダー（「⚙ 表示設定」で行番号=1 を指定すると列名として表示）
# A列: 商品ID（「⚙ 表示設定」で列番号=A を指定すると行名として表示）
# ---------------------------------------------------------------------------

BASE_SHEET1 = {
    # ヘッダー行（行1）
    "A1": "商品ID", "B1": "商品名",     "C1": "単価",  "D1": "在庫数", "E1": "カテゴリ",
    # データ行
    "A2": "P001",  "B2": "りんご",     "C2": "120",   "D2": "500",   "E2": "果物",
    "A3": "P002",  "B3": "みかん",     "C3": "80",    "D3": "300",   "E3": "果物",
    "A4": "P003",  "B4": "バナナ",     "C4": "200",   "D4": "150",   "E4": "果物",
    "A5": "P004",  "B5": "キャベツ",   "C5": "150",   "D5": "200",   "E5": "野菜",
    "A6": "P005",  "B6": "にんじん",   "C6": "100",   "D6": "400",   "E6": "野菜",
    "A7": "P006",  "B7": "じゃがいも", "C7": "180",   "D7": "600",   "E7": "野菜",
    "A8": "P007",  "B8": "トマト",     "C8": "250",   "D8": "120",   "E8": "野菜",
}

# file_b: 単価・在庫数に変更あり、新規行追加あり
FILE_B_SHEET1 = {
    # ヘッダー行（変更なし）
    "A1": "商品ID", "B1": "商品名",     "C1": "単価",  "D1": "在庫数", "E1": "カテゴリ",
    # データ行（一部変更）
    "A2": "P001",  "B2": "りんご",     "C2": "130",   "D2": "480",   "E2": "果物",   # 単価・在庫変更
    "A3": "P002",  "B3": "みかん",     "C3": "80",    "D3": "300",   "E3": "果物",   # 変更なし
    "A4": "P003",  "B4": "バナナ",     "C4": "190",   "D4": "150",   "E4": "果物",   # 単価変更
    "A5": "P004",  "B5": "キャベツ",   "C5": "150",   "D5": "180",   "E5": "野菜",   # 在庫変更
    "A6": "P005",  "B6": "にんじん",   "C6": "100",   "D6": "400",   "E6": "野菜",   # 変更なし
    "A7": "P006",  "B7": "じゃがいも", "C7": "200",   "D7": "550",   "E7": "野菜",   # 単価・在庫変更
    "A8": "P007",  "B8": "トマト",     "C8": "250",   "D8": "100",   "E8": "野菜",   # 在庫変更
    "A9": "P008",  "B9": "ほうれん草", "C9": "120",   "D9": "200",   "E9": "野菜",   # 新規追加
}

BASE_SHEET2 = {
    "A1": "注文番号", "B1": "顧客名",   "C1": "金額",   "D1": "ステータス",
    "A2": "ORD-001", "B2": "田中太郎",  "C2": "5000",  "D2": "完了",
    "A3": "ORD-002", "B3": "鈴木花子",  "C3": "12000", "D3": "処理中",
    "A4": "ORD-003", "B4": "佐藤次郎",  "C4": "3500",  "D4": "完了",
}

FILE_B_SHEET2 = {
    "A1": "注文番号", "B1": "顧客名",   "C1": "金額",   "D1": "ステータス",
    "A2": "ORD-001", "B2": "田中太郎",  "C2": "5000",  "D2": "完了",
    "A3": "ORD-002", "B3": "鈴木花子",  "C3": "12000", "D3": "完了",      # ステータス変更
    "A4": "ORD-003", "B4": "佐藤次郎",  "C4": "3800",  "D4": "完了",      # 金額変更
}

if __name__ == "__main__":
    base = make_xlsx({"商品マスタ": BASE_SHEET1, "注文履歴": BASE_SHEET2})
    file_b = make_xlsx({"商品マスタ": FILE_B_SHEET1, "注文履歴": FILE_B_SHEET2})

    (OUTPUT_DIR / "base.xlsx").write_bytes(base)
    (OUTPUT_DIR / "file_b.xlsx").write_bytes(file_b)
    print("生成完了:")
    print(f"  {OUTPUT_DIR / 'base.xlsx'}")
    print(f"  {OUTPUT_DIR / 'file_b.xlsx'}")
    print()
    print("動作確認手順:")
    print("  1. ツールで base.xlsx と file_b.xlsx を比較")
    print("  2. 商品マスタシートを開く")
    print("  3. 「⚙ 表示設定」→ 列名に使う行番号 = 1 → 適用")
    print("     → 列ヘッダー下に「商品名」「単価」「在庫数」等が表示される")
    print("  4. 「⚙ 表示設定」→ 行名に使う列番号 = A → 適用")
    print("     → 各行の横に「P001」〜「P007」が表示される")

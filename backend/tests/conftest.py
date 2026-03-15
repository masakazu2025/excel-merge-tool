"""テスト共通ヘルパー"""
import io
import zipfile
import xml.etree.ElementTree as ET


def make_xlsx(sheets: dict[str, dict[str, str]]) -> bytes:
    """
    最小限の xlsx をメモリ上で生成する。
    sheets = {"Sheet1": {"A1": "値", ...}, ...}
    """
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        sheet_names = list(sheets.keys())

        # [Content_Types].xml
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

        # _rels/.rels
        zf.writestr("_rels/.rels", """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="xl/workbook.xml"/>
</Relationships>""")

        # xl/_rels/workbook.xml.rels
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

        # xl/workbook.xml
        sheet_elems = "\n".join(
            f'<sheet name="{name}" sheetId="{i+1}" r:id="rId{i+1}"/>'
            for i, name in enumerate(sheet_names)
        )
        zf.writestr("xl/workbook.xml", f"""<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>{sheet_elems}</sheets>
</workbook>""")

        # xl/worksheets/sheetN.xml
        for i, (sheet_name, cells) in enumerate(sheets.items()):
            rows: dict[int, list] = {}
            for coord, val in cells.items():
                import re
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


def make_xlsx_with_comment(cell: str, comment_text: str) -> bytes:
    """
    Sheet1 にノート（xl/comments1.xml）を1件持つ最小限の xlsx を生成する。
    cell: コメントが付いているセル座標（例: "A1"）
    comment_text: ノートのテキスト
    """
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("[Content_Types].xml", """<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/comments1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml"/>
</Types>""")

        zf.writestr("_rels/.rels", """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="xl/workbook.xml"/>
</Relationships>""")

        zf.writestr("xl/_rels/workbook.xml.rels", """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
    Target="worksheets/sheet1.xml"/>
</Relationships>""")

        zf.writestr("xl/workbook.xml", """<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>""")

        zf.writestr("xl/_rels/sheet1.xml.rels", """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments"
    Target="../comments1.xml"/>
</Relationships>""")

        zf.writestr("xl/worksheets/sheet1.xml", f"""<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData/>
  <legacyDrawing r:id="rId1"
    xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
</worksheet>""")

        zf.writestr("xl/comments1.xml", f"""<?xml version="1.0" encoding="UTF-8"?>
<comments xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <authors><author>Author</author></authors>
  <commentList>
    <comment ref="{cell}" authorId="0">
      <text><r><t>{comment_text}</t></r></text>
    </comment>
  </commentList>
</comments>""")

    return buf.getvalue()


def make_xlsx_with_shape(shape_id: str, shape_text: str) -> bytes:
    """
    Sheet1 にテキストボックス（sp）を1つ持つ最小限の xlsx を生成する。
    shape_id: 図形の cNvPr id 属性（例: "1"）
    shape_text: テキストボックスのテキスト
    """
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("[Content_Types].xml", """<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/drawings/drawing1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
</Types>""")

        zf.writestr("_rels/.rels", """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="xl/workbook.xml"/>
</Relationships>""")

        zf.writestr("xl/_rels/workbook.xml.rels", """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
    Target="worksheets/sheet1.xml"/>
</Relationships>""")

        zf.writestr("xl/workbook.xml", """<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>""")

        zf.writestr("xl/_rels/sheet1.xml.rels", """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing"
    Target="../drawings/drawing1.xml"/>
</Relationships>""")

        zf.writestr("xl/worksheets/sheet1.xml", """<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData/>
  <drawing r:id="rId1"
    xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
</worksheet>""")

        NS_XDR = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
        NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main"
        zf.writestr("xl/drawings/drawing1.xml", f"""<?xml version="1.0" encoding="UTF-8"?>
<xdr:wsDr xmlns:xdr="{NS_XDR}" xmlns:a="{NS_A}">
  <xdr:twoCellAnchor>
    <xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
    <xdr:to><xdr:col>2</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>2</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
    <xdr:sp>
      <xdr:nvSpPr>
        <xdr:cNvPr id="{shape_id}" name="TextBox {shape_id}"/>
        <xdr:cNvSpPr><a:spLocks noGrp="1"/></xdr:cNvSpPr>
      </xdr:nvSpPr>
      <xdr:spPr/>
      <xdr:txBody>
        <a:bodyPr/>
        <a:p><a:r><a:t>{shape_text}</a:t></a:r></a:p>
      </xdr:txBody>
    </xdr:sp>
    <xdr:clientData/>
  </xdr:twoCellAnchor>
</xdr:wsDr>""")

    return buf.getvalue()

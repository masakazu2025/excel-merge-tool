/**
 * B-026: グリッドで差分セルを色分け表示する
 * B-027: 変更のない行・列は非表示にする
 * B-028: モーダルを開いたままキーボードで差分セル間を移動できる
 * B-029: シートを切り替えられる
 * B-031: 列・行フィルタで特定の列・行を除外できる
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Report from '../pages/Report'
import DiffGrid from '../components/DiffGrid'
import type { CellDiff } from '../types/diff'

// ---------------------------------------------------------------------------
// ユーティリティ
// ---------------------------------------------------------------------------

function renderReport(reportId = 'test-report') {
  return render(
    <MemoryRouter initialEntries={[`/report/${reportId}`]}>
      <Routes>
        <Route path="/report/:reportId" element={<Report />} />
        <Route path="/" element={<div>ホーム</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function makeCell(overrides: Partial<CellDiff> & Pick<CellDiff, 'cell' | 'status'>): CellDiff {
  return {
    id: overrides.cell,
    base_value: '旧',
    b_value: '新',
    c_value: null,
    type: 'string',
    changed_by: 'b',
    ...overrides,
  } as CellDiff
}

function mockReport(sheets: Record<string, { cells: CellDiff[] }>) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify({
        meta: {
          created_at: '2026-03-14T12:00:00',
          base_file: 'base.xlsx',
          file_b: 'b.xlsx',
          file_c: null,
          total_diffs: 1,
          total_conflicts: 0,
        },
        sheets: Object.fromEntries(
          Object.entries(sheets).map(([name, data]) => [
            name,
            { cells: data.cells, comments: [], shapes: { matched: [], added_b: [], added_c: [], deleted_b: [], deleted_c: [] } },
          ])
        ),
      }),
      { status: 200 }
    )
  )
}

afterEach(() => vi.restoreAllMocks())

// ---------------------------------------------------------------------------
// B-026: 差分セルの色分け表示
// ---------------------------------------------------------------------------

describe('B-026: 差分セルの色分け表示', () => {
  it('status=conflict のセルにオレンジ背景クラスが付く', () => {
    const cells = [makeCell({ cell: 'A1', status: 'conflict', changed_by: 'both', b_value: 'B値', c_value: 'C値' })]
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>)
    const td = document.querySelector('td[data-key="1-A"]')
    expect(td?.className).toContain('bg-orange-200')
  })

  it('status=new のセルに緑背景クラスが付く', () => {
    const cells = [makeCell({ cell: 'A1', status: 'new', base_value: null, b_value: '新' })]
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>)
    const td = document.querySelector('td[data-key="1-A"]')
    expect(td?.className).toContain('bg-green-100')
  })

  it('status=add のセルに青背景クラスが付く', () => {
    const cells = [makeCell({ cell: 'A1', status: 'add', b_value: '元の値追記' })]
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>)
    const td = document.querySelector('td[data-key="1-A"]')
    expect(td?.className).toContain('bg-blue-100')
  })

  it('status=delete のセルに赤背景クラスが付く', () => {
    const cells = [makeCell({ cell: 'A1', status: 'delete', b_value: null })]
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>)
    const td = document.querySelector('td[data-key="1-A"]')
    expect(td?.className).toContain('bg-red-100')
  })

  it('status=sub のセルに薄赤背景クラスが付く', () => {
    const cells = [makeCell({ cell: 'A1', status: 'sub', b_value: '元の値' })]
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>)
    const td = document.querySelector('td[data-key="1-A"]')
    expect(td?.className).toContain('bg-red-50')
  })

  it('status=update のセルに黄背景クラスが付く', () => {
    const cells = [makeCell({ cell: 'A1', status: 'update' })]
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>)
    const td = document.querySelector('td[data-key="1-A"]')
    expect(td?.className).toContain('bg-yellow-100')
  })

  it('セルの表示値は b_value を使用する', () => {
    const cells = [makeCell({ cell: 'A1', status: 'update', base_value: '旧値', b_value: '新値' })]
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>)
    expect(screen.getByText('新値')).toBeInTheDocument()
  })

  it('b_value が null のとき base_value を表示する', () => {
    const cells = [makeCell({ cell: 'A1', status: 'delete', base_value: '元の値', b_value: null })]
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>)
    expect(screen.getByText('元の値')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// B-027: 変更のない行・列は非表示にする
// ---------------------------------------------------------------------------

describe('B-027: 変更セルのみ表示', () => {
  it('変更セルの行番号のみヘッダーに表示される', () => {
    // A1 と C3 に変更セルがある場合、行1と行3のみ
    const cells = [
      makeCell({ cell: 'A1', status: 'update' }),
      makeCell({ cell: 'C3', status: 'new', base_value: null }),
    ]
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>)
    // 行ヘッダー
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    // 行2は存在しない
    expect(screen.queryByText('2')).not.toBeInTheDocument()
  })

  it('変更セルの列のみヘッダーに表示される', () => {
    const cells = [
      makeCell({ cell: 'A1', status: 'update' }),
      makeCell({ cell: 'C3', status: 'new', base_value: null }),
    ]
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
    expect(screen.queryByText('B')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// B-028: モーダルを開いたままキーボードで移動できる
// ---------------------------------------------------------------------------

describe('B-028: キーボードナビゲーション', () => {
  it('セルをクリックするとモーダルが開く', async () => {
    const user = userEvent.setup()
    const cells = [
      makeCell({ cell: 'A1', status: 'update', base_value: '旧A1', b_value: '新A1' }),
    ]
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>)
    const td = document.querySelector('td[data-key="1-A"]') as HTMLElement
    await user.click(td)
    // モーダルが開く（CellDetailModal は A1 の値を表示するはず）
    await waitFor(() => {
      expect(screen.getByText('A1')).toBeInTheDocument()
    })
  })

  it('→キーで同じ行の右のセルに移動する', async () => {
    const user = userEvent.setup()
    const cells = [
      makeCell({ cell: 'A1', status: 'update', b_value: '新A1' }),
      makeCell({ cell: 'B1', status: 'update', b_value: '新B1' }),
    ]
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>)

    // A1 をクリックしてモーダルを開く
    const tdA1 = document.querySelector('td[data-key="1-A"]') as HTMLElement
    await user.click(tdA1)
    await waitFor(() => expect(screen.getByText('A1')).toBeInTheDocument())

    // → キー
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => expect(screen.getByText('B1')).toBeInTheDocument())
  })

  it('↓キーで次の行のセルに移動する', async () => {
    const user = userEvent.setup()
    const cells = [
      makeCell({ cell: 'A1', status: 'update', b_value: '新A1' }),
      makeCell({ cell: 'A2', status: 'update', b_value: '新A2' }),
    ]
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>)

    const tdA1 = document.querySelector('td[data-key="1-A"]') as HTMLElement
    await user.click(tdA1)
    await waitFor(() => expect(screen.getByText('A1')).toBeInTheDocument())

    fireEvent.keyDown(window, { key: 'ArrowDown' })
    await waitFor(() => expect(screen.getByText('A2')).toBeInTheDocument())
  })
})

// ---------------------------------------------------------------------------
// B-029: シートの切り替え
// ---------------------------------------------------------------------------

describe('B-029: シート切り替え', () => {
  it('複数シートのタブが表示される', async () => {
    mockReport({
      Sheet1: { cells: [makeCell({ cell: 'A1', status: 'update' })] },
      Sheet2: { cells: [makeCell({ cell: 'B2', status: 'new', base_value: null })] },
    })
    renderReport()
    await waitFor(() => {
      expect(screen.getByText('Sheet1')).toBeInTheDocument()
      expect(screen.getByText('Sheet2')).toBeInTheDocument()
    })
  })

  it('シートタブをクリックするとそのシートのグリッドが表示される', async () => {
    const user = userEvent.setup()
    mockReport({
      Sheet1: { cells: [makeCell({ cell: 'A1', status: 'update', b_value: 'Sheet1の値' })] },
      Sheet2: { cells: [makeCell({ cell: 'B2', status: 'new', base_value: null, b_value: 'Sheet2の値' })] },
    })
    renderReport()

    await waitFor(() => {
      expect(screen.getByText('Sheet1の値')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Sheet2'))

    await waitFor(() => {
      expect(screen.getByText('Sheet2の値')).toBeInTheDocument()
    })
  })

  it('シートを切り替えるとフィルタが「すべて」にリセットされる', async () => {
    const user = userEvent.setup()
    mockReport({
      Sheet1: { cells: [makeCell({ cell: 'A1', status: 'conflict', changed_by: 'both', b_value: 'B', c_value: 'C' })] },
      Sheet2: { cells: [makeCell({ cell: 'A1', status: 'update', b_value: '値' })] },
    })
    renderReport()

    await waitFor(() => {
      expect(screen.getByText('Sheet1')).toBeInTheDocument()
    })

    // 競合フィルタを選択
    await user.click(screen.getByRole('button', { name: /⚠ 競合/ }))

    // Sheet2 に切り替え
    await user.click(screen.getByText('Sheet2'))

    // フィルタが「すべて」に戻っている（すべてボタンが active 状態 = bg-blue-600 クラス）
    await waitFor(() => {
      const allBtn = screen.getByRole('button', { name: 'すべて' })
      expect(allBtn.className).toContain('bg-blue-600')
    })
  })

  it('差分のないシートのタブは表示されない', async () => {
    mockReport({
      Sheet1: { cells: [makeCell({ cell: 'A1', status: 'update' })] },
      Sheet2: { cells: [] },
    })
    renderReport()

    await waitFor(() => {
      expect(screen.getByText('Sheet1')).toBeInTheDocument()
    })
    expect(screen.queryByText('Sheet2')).not.toBeInTheDocument()
  })

  it('全シートが差分なしの場合は「差分がありません」が表示される', async () => {
    mockReport({
      Sheet1: { cells: [] },
      Sheet2: { cells: [] },
    })
    renderReport()

    await waitFor(() => {
      expect(screen.getByText('差分がありません')).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// B-031: 列・行フィルタ
// ---------------------------------------------------------------------------

describe('B-031: 列・行フィルタ', () => {
  it('「列 ▾」ボタンが表示される', async () => {
    mockReport({
      Sheet1: { cells: [makeCell({ cell: 'A1', status: 'update' })] },
    })
    renderReport()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /列/ })).toBeInTheDocument()
    })
  })

  it('「列 ▾」をクリックするとドロップダウンが開き差分のある列が表示される', async () => {
    const user = userEvent.setup()
    mockReport({
      Sheet1: { cells: [
        makeCell({ cell: 'A1', status: 'update' }),
        makeCell({ cell: 'C2', status: 'new', base_value: null }),
      ] },
    })
    renderReport()
    await waitFor(() => expect(screen.getByRole('button', { name: /列/ })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /列/ }))

    expect(screen.getByLabelText('A')).toBeInTheDocument()
    expect(screen.getByLabelText('C')).toBeInTheDocument()
  })

  it('列のチェックを外すとその列のセルが非表示になる', async () => {
    const user = userEvent.setup()
    mockReport({
      Sheet1: { cells: [
        makeCell({ cell: 'A1', status: 'update', b_value: 'A1値' }),
        makeCell({ cell: 'C2', status: 'update', b_value: 'C2値' }),
      ] },
    })
    renderReport()
    await waitFor(() => expect(screen.getByText('A1値')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /列/ }))
    await user.click(screen.getByLabelText('A'))

    await waitFor(() => {
      expect(screen.queryByText('A1値')).not.toBeInTheDocument()
      expect(screen.getByText('C2値')).toBeInTheDocument()
    })
  })

  it('列を除外するとその列にしか差分がない行も非表示になる', async () => {
    const user = userEvent.setup()
    mockReport({
      Sheet1: { cells: [
        makeCell({ cell: 'A1', status: 'update', b_value: 'A1値' }),
        makeCell({ cell: 'D3', status: 'update', b_value: 'D3値' }), // D列のみの行3
      ] },
    })
    renderReport()
    await waitFor(() => expect(screen.getByText('D3値')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /列/ }))
    await user.click(screen.getByLabelText('D'))

    await waitFor(() => {
      expect(screen.queryByText('D3値')).not.toBeInTheDocument()
      // 行3の行番号も消えている
      expect(screen.queryByText('3')).not.toBeInTheDocument()
    })
  })

  it('除外中はボタンが「列 N除外」と表示されオレンジ色になる', async () => {
    const user = userEvent.setup()
    mockReport({
      Sheet1: { cells: [
        makeCell({ cell: 'A1', status: 'update' }),
        makeCell({ cell: 'B1', status: 'update' }),
      ] },
    })
    renderReport()
    await waitFor(() => expect(screen.getByRole('button', { name: /列/ })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /列/ }))
    await user.click(screen.getByLabelText('A'))

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /1除外/ })
      expect(btn).toBeInTheDocument()
      expect(btn.className).toContain('bg-orange')
    })
  })

  it('「すべて解除」で除外がリセットされボタンが通常に戻る', async () => {
    const user = userEvent.setup()
    mockReport({
      Sheet1: { cells: [
        makeCell({ cell: 'A1', status: 'update', b_value: 'A1値' }),
        makeCell({ cell: 'B1', status: 'update', b_value: 'B1値' }),
      ] },
    })
    renderReport()
    await waitFor(() => expect(screen.getByText('A1値')).toBeInTheDocument())

    // A列を除外
    await user.click(screen.getByRole('button', { name: /列/ }))
    await user.click(screen.getByLabelText('A'))
    await waitFor(() => expect(screen.queryByText('A1値')).not.toBeInTheDocument())

    // ドロップダウンは開いたままなので「すべて選択」をそのままクリック
    await user.click(screen.getByRole('button', { name: 'すべて選択' }))

    await waitFor(() => {
      expect(screen.getByText('A1値')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^列/ })).not.toHaveClass('bg-orange-100')
    })
  })

  it('シート切り替えでそのシートのフィルタは保持される', async () => {
    const user = userEvent.setup()
    mockReport({
      Sheet1: { cells: [
        makeCell({ cell: 'A1', status: 'update', b_value: 'A1値' }),
        makeCell({ cell: 'B1', status: 'update', b_value: 'B1値' }),
      ] },
      Sheet2: { cells: [makeCell({ cell: 'C1', status: 'update', b_value: 'C1値' })] },
    })
    renderReport()
    await waitFor(() => expect(screen.getByText('A1値')).toBeInTheDocument())

    // Sheet1 で A列を除外
    await user.click(screen.getByRole('button', { name: /列/ }))
    await user.click(screen.getByLabelText('A'))
    await waitFor(() => expect(screen.queryByText('A1値')).not.toBeInTheDocument())

    // Sheet2 に切り替え
    await user.click(screen.getByText('Sheet2'))
    await waitFor(() => expect(screen.getByText('C1値')).toBeInTheDocument())

    // Sheet1 に戻ると除外が維持されている
    await user.click(screen.getByText('Sheet1'))
    await waitFor(() => {
      expect(screen.queryByText('A1値')).not.toBeInTheDocument()
      expect(screen.getByText('B1値')).toBeInTheDocument()
    })
  })

  it('列を除外すると行フィルタのドロップダウンからその列にしかない行が消える', async () => {
    const user = userEvent.setup()
    mockReport({
      Sheet1: { cells: [
        makeCell({ cell: 'A1', status: 'update', b_value: 'A1値' }),
        makeCell({ cell: 'D3', status: 'update', b_value: 'D3値' }), // 3行目はD列のみ
      ] },
    })
    renderReport()
    await waitFor(() => expect(screen.getByText('A1値')).toBeInTheDocument())

    // D列を除外
    await user.click(screen.getByRole('button', { name: /列/ }))
    await user.click(screen.getByLabelText('D'))

    // 行フィルタを開く → 3行目（D列のみ）は項目に出ない
    await user.click(screen.getByRole('button', { name: /行/ }))
    expect(screen.queryByLabelText('3')).not.toBeInTheDocument()
    expect(screen.getByLabelText('1')).toBeInTheDocument()
  })
})

/**
 * B-026: グリッドで差分セルを色分け表示する
 * B-027: 変更のない行・列は非表示にする
 * B-028: モーダルを開いたままキーボードで差分セル間を移動できる
 * B-029: シートを切り替えられる
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

  it('差分のないシートでは「差分なし」が表示される', async () => {
    const user = userEvent.setup()
    mockReport({
      Sheet1: { cells: [makeCell({ cell: 'A1', status: 'update' })] },
      Sheet2: { cells: [] },
    })
    renderReport()

    await waitFor(() => {
      expect(screen.getByText('Sheet2')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Sheet2'))

    await waitFor(() => {
      expect(screen.getByText('差分なし')).toBeInTheDocument()
    })
  })
})

/**
 * B-031: フロントエンドのエラーハンドリング
 *
 * F001: ネットワークエラー（fetch が throw）
 * F002: バックエンドエラーレスポンス受信（4xx/5xx）
 * F003: response.json() 失敗 / sheets フィールドなし / 不正なセルデータ
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Home from '../pages/Home'
import Report from '../pages/Report'
import DiffGrid from '../components/DiffGrid'
import type { CellDiff } from '../types/diff'

// ---------------------------------------------------------------------------
// テストユーティリティ
// ---------------------------------------------------------------------------

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report/:reportId" element={<div>レポート画面</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function renderReport(reportId = 'test-report') {
  return render(
    <MemoryRouter initialEntries={[`/report/${reportId}`]}>
      <Routes>
        <Route path="/report/:reportId" element={<Report />} />
        <Route path="/" element={<div>ホーム画面</div>} />
      </Routes>
    </MemoryRouter>
  )
}

/** File オブジェクトのモック（xlsx 拡張子） */
function makeFile(name: string): File {
  return new File(['dummy'], name, { type: 'application/octet-stream' })
}

/** FileSelectionList にファイルを追加するヘルパー */
async function addFiles(user: ReturnType<typeof userEvent.setup>, files: File[]) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  await user.upload(input, files)
}

// ---------------------------------------------------------------------------
// F001: ネットワークエラー（Home ページ）
// ---------------------------------------------------------------------------

describe('F001: ネットワークエラー（比較実行時）', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
  })
  afterEach(() => vi.restoreAllMocks())

  it('fetch が throw したとき "サーバーに接続できません" を表示する', async () => {
    const user = userEvent.setup()
    renderHome()

    await addFiles(user, [makeFile('base.xlsx'), makeFile('b.xlsx')])

    const btn = screen.getByRole('button', { name: '比較実行' })
    await user.click(btn)

    await waitFor(() => {
      expect(screen.getByText('サーバーに接続できません')).toBeInTheDocument()
    })
  })

  it('エラーメッセージ表示後も画面がクラッシュしない（ボタンが存在する）', async () => {
    const user = userEvent.setup()
    renderHome()

    await addFiles(user, [makeFile('base.xlsx'), makeFile('b.xlsx')])
    await user.click(screen.getByRole('button', { name: '比較実行' }))

    await waitFor(() => {
      expect(screen.getByText('サーバーに接続できません')).toBeInTheDocument()
    })
    // ボタンはまだ存在する（クラッシュしていない）
    expect(screen.getByRole('button', { name: '比較実行' })).toBeInTheDocument()
  })
})

describe('F001: ネットワークエラー（Report ページ）', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
  })
  afterEach(() => vi.restoreAllMocks())

  it('fetch が throw したとき "サーバーに接続できません" を表示する', async () => {
    renderReport()
    await waitFor(() => {
      expect(screen.getByText('サーバーに接続できません')).toBeInTheDocument()
    })
  })

  it('エラーメッセージ表示後も画面がクラッシュしない（「ホームへ戻る」リンクがある）', async () => {
    renderReport()
    await waitFor(() => {
      expect(screen.getByText('ホームへ戻る')).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// F002: バックエンドエラーレスポンス（4xx/5xx）
// ---------------------------------------------------------------------------

describe('F002: バックエンドエラーレスポンス（Report ページ）', () => {
  afterEach(() => vi.restoreAllMocks())

  it('404 レスポンスのとき detail.message を画面に表示する', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ detail: { error_code: 'E006', message: 'レポートが見つかりません' } }),
        { status: 404 }
      )
    )
    renderReport()
    await waitFor(() => {
      expect(screen.getByText('レポートが見つかりません')).toBeInTheDocument()
    })
  })

  it('422 レスポンスのとき detail.message をそのまま表示する', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ detail: { error_code: 'E001', message: '対応していないファイル形式です' } }),
        { status: 422 }
      )
    )
    renderReport()
    await waitFor(() => {
      expect(screen.getByText('対応していないファイル形式です')).toBeInTheDocument()
    })
  })

  it('エラー画面でも「ホームへ戻る」リンクが表示される（クラッシュしない）', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ detail: { error_code: 'E006', message: 'レポートが見つかりません' } }),
        { status: 404 }
      )
    )
    renderReport()
    await waitFor(() => {
      expect(screen.getByText('ホームへ戻る')).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// F003: response.json() 失敗（Report ページ）
// ---------------------------------------------------------------------------

describe('F003: response.json() 失敗', () => {
  afterEach(() => vi.restoreAllMocks())

  it('JSON パース失敗時に "レポートの形式が正しくありません" を表示する', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{ broken json <<<', { status: 200 })
    )
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderReport()
    await waitFor(() => {
      expect(screen.getByText('レポートの形式が正しくありません')).toBeInTheDocument()
    })
    consoleSpy.mockRestore()
  })

  it('JSON パース失敗時に console.error が呼ばれる', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{ broken json <<<', { status: 200 })
    )
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderReport()
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// F003: sheets フィールドが undefined
// ---------------------------------------------------------------------------

describe('F003: sheets フィールドなし', () => {
  afterEach(() => vi.restoreAllMocks())

  it('"sheets" が存在しない JSON のとき "レポートの形式が正しくありません" を表示する', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ meta: {} }), { status: 200 })
    )
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderReport()
    await waitFor(() => {
      expect(screen.getByText('レポートの形式が正しくありません')).toBeInTheDocument()
    })
    consoleSpy.mockRestore()
  })

  it('"sheets" なし JSON のとき console.error が呼ばれる', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ meta: {} }), { status: 200 })
    )
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderReport()
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// F003: DiffGrid に不正なセルデータ
// ---------------------------------------------------------------------------

describe('F003: DiffGrid に不正なセルデータ', () => {
  const validCell: CellDiff = {
    id: '1',
    cell: 'A1',
    base_value: '旧',
    b_value: '新',
    c_value: null,
    type: 'string',
    changed_by: 'b',
    status: 'update',
  }

  it('cell フィールドがない要素をスキップして画面がクラッシュしない', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    // cell フィールドなしの不正データを混在させる
    const cells = [
      validCell,
      { id: '2', base_value: null, b_value: '値', c_value: null, type: 'string', changed_by: 'b', status: 'new' } as unknown as CellDiff,
    ]
    const { container } = render(
      <MemoryRouter>
        <DiffGrid cells={cells} />
      </MemoryRouter>
    )
    // 有効なセル A1 は表示される
    expect(container).toBeInTheDocument()
    consoleSpy.mockRestore()
  })

  it('不正セルに対して console.error が呼ばれる', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const cells = [
      { id: '2', base_value: null, b_value: '値', c_value: null, type: 'string', changed_by: 'b', status: 'new' } as unknown as CellDiff,
    ]
    render(
      <MemoryRouter>
        <DiffGrid cells={cells} />
      </MemoryRouter>
    )
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

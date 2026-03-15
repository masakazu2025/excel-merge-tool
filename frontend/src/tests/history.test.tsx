/**
 * B-021: 履歴をテーブルで表示する
 * B-022: 行クリックで結果画面に遷移する
 * B-023: 履歴が0件のとき空メッセージを表示する
 * B-025: ページネーションで件数を制御する
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import History from '../pages/History'

// ---------------------------------------------------------------------------
// テストユーティリティ
// ---------------------------------------------------------------------------

function renderHistory() {
  return render(
    <MemoryRouter initialEntries={['/history']}>
      <Routes>
        <Route path="/history" element={<History />} />
        <Route path="/report/:reportId" element={<div data-testid="report-page">レポート</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function makeReport(i: number) {
  return {
    report_id: `20260314_${String(i).padStart(6, '0')}`,
    created_at: `2026-03-14T${String(i).padStart(2, '0')}:00:00`,
    base_file: `base_${i}.xlsx`,
    file_b: `b_${i}.xlsx`,
    file_c: i % 2 === 0 ? `c_${i}.xlsx` : null,
    total_diffs: i * 3,
    total_conflicts: 0,
  }
}

function mockFetch(reports: ReturnType<typeof makeReport>[], total?: number, page = 1, limit = 25) {
  const t = total ?? reports.length
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify({ items: reports, total: t, page, limit }),
      { status: 200 }
    )
  )
}

afterEach(() => vi.restoreAllMocks())

// ---------------------------------------------------------------------------
// B-021: 履歴をテーブルで表示する
// ---------------------------------------------------------------------------

describe('B-021: 履歴テーブル表示', () => {
  it('テーブルに実行日時・比較元・変更ファイル・差分件数が表示される', async () => {
    mockFetch([makeReport(1)])
    renderHistory()
    await waitFor(() => {
      expect(screen.getByText(/base_1\.xlsx/)).toBeInTheDocument()
      expect(screen.getByText(/b_1\.xlsx/)).toBeInTheDocument()
      expect(screen.getByText(/3件/)).toBeInTheDocument()
    })
  })

  it('テーブルヘッダーに 実行日時・比較元・変更ファイル・差分件数 が含まれる', async () => {
    mockFetch([makeReport(1)])
    renderHistory()
    await waitFor(() => {
      expect(screen.getByText('実行日時')).toBeInTheDocument()
      expect(screen.getByText('比較元')).toBeInTheDocument()
      expect(screen.getByText('変更ファイル')).toBeInTheDocument()
      expect(screen.getByText('差分件数')).toBeInTheDocument()
    })
  })

  it('file_c がある場合は改行で2行表示される', async () => {
    mockFetch([makeReport(2)]) // i=2 → file_c あり
    renderHistory()
    await waitFor(() => {
      expect(screen.getByText(/b_2\.xlsx/)).toBeInTheDocument()
      expect(screen.getByText(/c_2\.xlsx/)).toBeInTheDocument()
    })
  })

  it('file_c がない場合はファイルBのみ表示される', async () => {
    mockFetch([makeReport(1)]) // i=1 → file_c なし
    renderHistory()
    await waitFor(() => {
      expect(screen.queryByText(/c_1\.xlsx/)).not.toBeInTheDocument()
    })
  })

  it('複数件が表示される', async () => {
    mockFetch([makeReport(1), makeReport(2), makeReport(3)])
    renderHistory()
    await waitFor(() => {
      expect(screen.getByText(/base_1\.xlsx/)).toBeInTheDocument()
      expect(screen.getByText(/base_2\.xlsx/)).toBeInTheDocument()
      expect(screen.getByText(/base_3\.xlsx/)).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// B-022: 行クリックで結果画面に遷移する
// ---------------------------------------------------------------------------

describe('B-022: 行クリックで遷移', () => {
  it('行クリックで /report/{report_id} に遷移する', async () => {
    const user = userEvent.setup()
    mockFetch([makeReport(1)])
    renderHistory()

    await waitFor(() => {
      expect(screen.getByText(/base_1\.xlsx/)).toBeInTheDocument()
    })

    const row = screen.getByText(/base_1\.xlsx/).closest('tr')!
    await user.click(row)

    await waitFor(() => {
      expect(screen.getByTestId('report-page')).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// B-023: 履歴が0件のとき空メッセージを表示する
// ---------------------------------------------------------------------------

describe('B-023: 空メッセージ', () => {
  it('0件のとき "比較履歴がありません" を表示する', async () => {
    mockFetch([])
    renderHistory()
    await waitFor(() => {
      expect(screen.getByText('比較履歴がありません')).toBeInTheDocument()
    })
  })

  it('0件のときテーブルが表示されない', async () => {
    mockFetch([])
    renderHistory()
    await waitFor(() => {
      expect(screen.queryByText('実行日時')).not.toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// B-025: ページネーション
// ---------------------------------------------------------------------------

describe('B-025: ページネーション', () => {
  it('件数ドロップダウンが表示される', async () => {
    mockFetch([makeReport(1)])
    renderHistory()
    await waitFor(() => {
      // select が存在する
      expect(document.querySelector('select')).toBeInTheDocument()
    })
  })

  it('先頭ページでは「前へ」ボタンが非活性', async () => {
    const reports = Array.from({ length: 26 }, (_, i) => makeReport(i + 1))
    mockFetch(reports.slice(0, 25), 26, 1, 25)
    renderHistory()
    await waitFor(() => {
      const prevBtn = screen.getByRole('button', { name: '前へ' })
      expect(prevBtn).toBeDisabled()
    })
  })

  it('末尾ページでは「次へ」ボタンが非活性', async () => {
    const page1Reports = Array.from({ length: 25 }, (_, i) => makeReport(i + 1))
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: page1Reports, total: 26, page: 1, limit: 25 }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [makeReport(26)], total: 26, page: 2, limit: 25 }), { status: 200 })
      )

    const user = userEvent.setup()
    renderHistory()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '次へ' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: '次へ' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '次へ' })).toBeDisabled()
    })
  })

  it('件数を変更するとページが1に戻る', async () => {
    const reports = Array.from({ length: 25 }, (_, i) => makeReport(i + 1))
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ items: reports, total: 50, page: 1, limit: 25 }), { status: 200 })
      )

    const user = userEvent.setup()
    renderHistory()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '次へ' })).toBeInTheDocument()
    })

    // ページ2に移動
    await user.click(screen.getByRole('button', { name: '次へ' }))

    // limit 変更（10件表示に）
    const select = document.querySelector('select') as HTMLSelectElement
    await user.selectOptions(select, '10')

    // fetch が呼ばれて page=1 の表示になる
    await waitFor(() => {
      const prevBtn = screen.getByRole('button', { name: '前へ' })
      expect(prevBtn).toBeDisabled()
    })
  })

  it('1ページしかないときページネーションが表示されない', async () => {
    mockFetch([makeReport(1)]) // total=1, limit=25 → 1ページ
    renderHistory()
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '前へ' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '次へ' })).not.toBeInTheDocument()
    })
  })
})

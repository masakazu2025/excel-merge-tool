/**
 * B-010〜B-020, B-024: ファイル選択画面の振舞テスト
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Home from '../pages/Home'

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report/:reportId" element={<div>レポート</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function makeXlsx(name: string): File {
  return new File(['dummy'], name, { type: 'application/octet-stream' })
}

async function addFiles(user: ReturnType<typeof userEvent.setup>, files: File[]) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  await user.upload(input, files)
}

// ---------------------------------------------------------------------------
// B-011: ボタンからダイアログでファイルを選択できる
// ---------------------------------------------------------------------------

describe('B-011: ボタンでファイル選択', () => {
  it('input[type=file] が hidden で存在する（ダイアログ起動口）', () => {
    renderHome()
    const input = document.querySelector('input[type="file"]')
    expect(input).toBeInTheDocument()
  })

  it('ダイアログでファイルを選択するとリストに追加される', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('file1.xlsx')])
    expect(screen.getByText(/file1\.xlsx/)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// B-012: 複数ファイルを一度に追加できる
// ---------------------------------------------------------------------------

describe('B-012: 複数ファイルを一度に追加できる', () => {
  it('2ファイルを同時に追加すると両方リストに追加される', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('a.xlsx'), makeXlsx('b.xlsx')])
    expect(screen.getByText(/a\.xlsx/)).toBeInTheDocument()
    expect(screen.getByText(/b\.xlsx/)).toBeInTheDocument()
  })

  it('3ファイルを同時に追加すると全部リストに追加される', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('a.xlsx'), makeXlsx('b.xlsx'), makeXlsx('c.xlsx')])
    expect(screen.getByText(/a\.xlsx/)).toBeInTheDocument()
    expect(screen.getByText(/b\.xlsx/)).toBeInTheDocument()
    expect(screen.getByText(/c\.xlsx/)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// B-013: 追加したファイルがリストに表示される
// ---------------------------------------------------------------------------

describe('B-013: ファイルリストの表示', () => {
  it('追加したファイル名がリストに表示される', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('base.xlsx'), makeXlsx('b.xlsx')])
    expect(screen.getByText(/base\.xlsx/)).toBeInTheDocument()
    expect(screen.getByText(/b\.xlsx/)).toBeInTheDocument()
  })

  it('×ボタンが各行に存在する', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('a.xlsx'), makeXlsx('b.xlsx')])
    const removeButtons = screen.getAllByTitle('削除')
    expect(removeButtons).toHaveLength(2)
  })

  it('追加した順にリストが並ぶ', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('first.xlsx'), makeXlsx('second.xlsx')])
    const items = screen.getAllByTitle('削除')
    // first.xlsx が上 (index 0)、second.xlsx が下 (index 1)
    const rows = items.map((btn) => btn.closest('div')!)
    expect(rows[0].textContent).toContain('first.xlsx')
    expect(rows[1].textContent).toContain('second.xlsx')
  })
})

// ---------------------------------------------------------------------------
// B-014: ファイル名の省略表示とマウスオーバー表示
// ---------------------------------------------------------------------------

describe('B-014: ファイル名ツールチップ', () => {
  it('ファイル名要素に title 属性が設定されている', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('very_long_filename_that_might_overflow.xlsx')])
    const el = screen.getByTitle('very_long_filename_that_might_overflow.xlsx')
    expect(el).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// B-015: デフォルトで先頭行が比較元に選択される
// ---------------------------------------------------------------------------

describe('B-015: デフォルト比較元選択', () => {
  it('最初にファイルを追加すると [比較元] バッジが表示される', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('first.xlsx')])
    expect(screen.getByText('比較元')).toBeInTheDocument()
  })

  it('2件目を追加しても比較元は変わらない', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('first.xlsx')])
    await addFiles(user, [makeXlsx('second.xlsx')])
    // [比較元] バッジは1つだけ
    expect(screen.getAllByText('比較元')).toHaveLength(1)
    // first.xlsx の行に比較元がある
    const badge = screen.getByText('比較元')
    expect(badge.closest('div')?.textContent).toContain('first.xlsx')
  })
})

// ---------------------------------------------------------------------------
// B-016: ラジオボタンで比較元を変更できる
// B-024: ファイル行クリックで比較元を変更できる
// ---------------------------------------------------------------------------

describe('B-016/B-024: 比較元の変更', () => {
  it('2件目の行をクリックすると比較元が変わる', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('first.xlsx'), makeXlsx('second.xlsx')])

    // second.xlsx の行をクリック
    const secondRow = screen.getByText(/second\.xlsx/).closest('div[class*="flex items-center"]')!
    await user.click(secondRow)

    // バッジが1つだけで second.xlsx の行にある
    expect(screen.getAllByText('比較元')).toHaveLength(1)
    const badge = screen.getByText('比較元')
    expect(badge.closest('div')?.textContent).toContain('second.xlsx')
  })

  it('比較元を変更すると前の行のバッジが消える', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('first.xlsx'), makeXlsx('second.xlsx')])

    const secondRow = screen.getByText(/second\.xlsx/).closest('div[class*="flex items-center"]')!
    await user.click(secondRow)

    // first.xlsx の行にはバッジがない
    const firstRow = screen.getByText(/first\.xlsx/).closest('div[class*="flex items-center"]')!
    expect(firstRow.textContent).not.toContain('比較元')
  })
})

// ---------------------------------------------------------------------------
// B-017: 比較元行に[比較元]バッジが表示される
// ---------------------------------------------------------------------------

describe('B-017: 比較元バッジ表示', () => {
  it('比較元のみにバッジが表示される', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('a.xlsx'), makeXlsx('b.xlsx'), makeXlsx('c.xlsx')])
    expect(screen.getAllByText('比較元')).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// B-018: ×ボタンでファイルを削除できる
// ---------------------------------------------------------------------------

describe('B-018: ×ボタンで削除', () => {
  it('×をクリックするとそのファイルがリストから消える', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('a.xlsx'), makeXlsx('b.xlsx')])

    // b.xlsx の×ボタンをクリック
    const removeButtons = screen.getAllByTitle('削除')
    await user.click(removeButtons[1]) // index 1 = b.xlsx

    expect(screen.queryByText(/b\.xlsx/)).not.toBeInTheDocument()
    expect(screen.getByText(/a\.xlsx/)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// B-019: 比較元行を削除すると先頭行が自動選択される
// ---------------------------------------------------------------------------

describe('B-019: 比較元削除時の自動選択', () => {
  it('比較元（先頭）を削除すると次の先頭が比較元になる', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('first.xlsx'), makeXlsx('second.xlsx')])

    // first.xlsx の×ボタン（比較元）を削除
    const removeButtons = screen.getAllByTitle('削除')
    await user.click(removeButtons[0])

    // second.xlsx が比較元になる
    expect(screen.getByText('比較元')).toBeInTheDocument()
    const badge = screen.getByText('比較元')
    expect(badge.closest('div')?.textContent).toContain('second.xlsx')
  })
})

// ---------------------------------------------------------------------------
// B-020: 1ファイル以下のとき比較実行がグレーアウトする
// ---------------------------------------------------------------------------

describe('B-020: 比較実行ボタンの活性制御', () => {
  it('初期状態（0件）でボタンが disabled', () => {
    renderHome()
    expect(screen.getByRole('button', { name: '比較実行' })).toBeDisabled()
  })

  it('1件だけのときボタンが disabled', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('a.xlsx')])
    expect(screen.getByRole('button', { name: '比較実行' })).toBeDisabled()
  })

  it('2件になるとボタンが有効になる', async () => {
    const user = userEvent.setup()
    renderHome()
    await addFiles(user, [makeXlsx('a.xlsx'), makeXlsx('b.xlsx')])
    expect(screen.getByRole('button', { name: '比較実行' })).not.toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// B-010: DnDでハイライト（ドラッグ状態のクラス変化）
// ---------------------------------------------------------------------------

describe('B-010: DnDドロップゾーンのハイライト', () => {
  it('dragover でドロップゾーンにハイライトクラスが付く', () => {
    renderHome()
    const dropzone = screen.getByText(/ここにドロップ/).closest('div')!
    fireEvent.dragOver(dropzone, { preventDefault: () => {} })
    expect(dropzone.className).toContain('border-blue-400')
  })

  it('dragleave でハイライトが消える', () => {
    renderHome()
    const dropzone = screen.getByText(/ここにドロップ/).closest('div')!
    fireEvent.dragOver(dropzone)
    fireEvent.dragLeave(dropzone)
    expect(dropzone.className).not.toContain('border-blue-400')
  })

  it('drop でファイルがリストに追加される', async () => {
    renderHome()
    const dropzone = screen.getByText(/ここにドロップ/).closest('div')!
    const file = makeXlsx('dropped.xlsx')
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
      preventDefault: () => {},
    })
    await waitFor(() => {
      expect(screen.getByText(/dropped\.xlsx/)).toBeInTheDocument()
    })
  })
})

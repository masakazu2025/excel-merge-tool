/**
 * B-038: 比較テーブルでキーボードナビゲーション（モーダルなし）
 * グリッドにフォーカスしている間、矢印キーでセル間を移動できる。
 * Enter キーで選択セルのモーダルを開く。
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import DiffGrid from "../components/DiffGrid";
import type { CellDiff } from "../types/diff";

function makeCell(override: Partial<CellDiff> = {}): CellDiff {
  return {
    sheet: "Sheet1",
    cell: "A1",
    status: "update",
    base_value: "旧",
    b_value: "新",
    c_value: null,
    comment_base: null,
    comment_b: null,
    comment_c: null,
    ...override,
  };
}

function getGrid() {
  return document.querySelector('[data-testid="diff-grid"]') as HTMLElement;
}

describe("B-038: 比較テーブルキーボードナビゲーション（モーダルなし）", () => {
  it("グリッド表示時に先頭セルが自動的にフォーカスされる", async () => {
    const cells = [makeCell({ cell: "A1" }), makeCell({ cell: "B1" })];
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>);
    await waitFor(() =>
      expect(document.querySelector('td[data-key="1-A"]')?.className).toContain("ring-2")
    );
  });

  it("→キーで同じ行の右セルに移動する（モーダルなし）", async () => {
    const cells = [makeCell({ cell: "A1" }), makeCell({ cell: "B1" })];
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>);
    // A1 は自動フォーカス済み
    await waitFor(() =>
      expect(document.querySelector('td[data-key="1-A"]')?.className).toContain("ring-2")
    );

    const grid = getGrid();
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    await waitFor(() =>
      expect(document.querySelector('td[data-key="1-B"]')?.className).toContain("ring-2")
    );
    // モーダルは開かない
    expect(screen.queryByText("B1")).not.toBeInTheDocument();
  });

  it("↓キーで次の行のセルに移動する（モーダルなし）", async () => {
    const cells = [makeCell({ cell: "A1" }), makeCell({ cell: "A2" })];
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>);
    // A1 は自動フォーカス済み
    await waitFor(() =>
      expect(document.querySelector('td[data-key="1-A"]')?.className).toContain("ring-2")
    );

    const grid = getGrid();
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    await waitFor(() =>
      expect(document.querySelector('td[data-key="2-A"]')?.className).toContain("ring-2")
    );
    expect(screen.queryByText("A2")).not.toBeInTheDocument();
  });

  it("Enterキーでフォーカス中のセルのモーダルが開く", async () => {
    const cells = [makeCell({ cell: "A1", b_value: "新A1" })];
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>);
    const grid = getGrid();
    grid.focus();

    // A1 にフォーカス
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    await waitFor(() =>
      expect(document.querySelector('td[data-key="1-A"]')?.className).toContain("ring-2")
    );

    // Enter でモーダルを開く
    fireEvent.keyDown(grid, { key: "Enter" });
    await waitFor(() => expect(screen.getByText("A1")).toBeInTheDocument());
  });

  it("モーダルが開いている状態で矢印キーを押すとモーダルの内容が更新される", async () => {
    const user = userEvent.setup();
    const cells = [makeCell({ cell: "A1" }), makeCell({ cell: "B1" })];
    render(<MemoryRouter><DiffGrid cells={cells} /></MemoryRouter>);

    // A1 クリックでモーダルを開く
    const tdA1 = document.querySelector('td[data-key="1-A"]') as HTMLElement;
    await user.click(tdA1);
    await waitFor(() => expect(screen.getByText("A1")).toBeInTheDocument());

    // → キーで B1 へ（モーダルも更新される）
    const grid = getGrid();
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    await waitFor(() => expect(screen.getByText("B1")).toBeInTheDocument());
  });
});

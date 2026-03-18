import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import History from "../pages/History";

const mockReports = [
  { report_id: "r1", created_at: "2026-03-19T10:00:00", base_file: "base.xlsx", file_b: "file_b.xlsx", file_c: null, total_diffs: 5, total_conflicts: 0 },
  { report_id: "r2", created_at: "2026-03-18T09:00:00", base_file: "base.xlsx", file_b: "file_b.xlsx", file_c: null, total_diffs: 3, total_conflicts: 0 },
  { report_id: "r3", created_at: "2026-03-17T08:00:00", base_file: "base.xlsx", file_b: "file_b.xlsx", file_c: null, total_diffs: 1, total_conflicts: 0 },
];

function stubFetch(reports = mockReports) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ items: reports, total: reports.length, page: 1, limit: 25 }),
  }));
}

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderHistory() {
  return render(
    <MemoryRouter>
      <History />
    </MemoryRouter>
  );
}

describe("B-038 一覧画面キーボードナビゲーション", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubFetch();
  });

  it("画面表示時に1行目1列目にカーソルが初期配置される", async () => {
    renderHistory();
    await waitFor(() => screen.getByText("2026-03-19 10:00"));
    const cells = document.querySelectorAll("td[data-focused='true']");
    expect(cells.length).toBe(1);
    expect(cells[0]).toHaveAttribute("data-row", "0");
    expect(cells[0]).toHaveAttribute("data-col", "0");
  });

  it("↓キーで次の行に移動する", async () => {
    const user = userEvent.setup();
    renderHistory();
    await waitFor(() => screen.getByText("2026-03-19 10:00"));
    await user.keyboard("{ArrowDown}");
    const focused = document.querySelector("td[data-focused='true']");
    expect(focused).toHaveAttribute("data-row", "1");
    expect(focused).toHaveAttribute("data-col", "0");
  });

  it("↑キーで前の行に移動する", async () => {
    const user = userEvent.setup();
    renderHistory();
    await waitFor(() => screen.getByText("2026-03-19 10:00"));
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowUp}");
    const focused = document.querySelector("td[data-focused='true']");
    expect(focused).toHaveAttribute("data-row", "0");
  });

  it("先頭行で↑キーを押しても移動しない", async () => {
    const user = userEvent.setup();
    renderHistory();
    await waitFor(() => screen.getByText("2026-03-19 10:00"));
    await user.keyboard("{ArrowUp}");
    const focused = document.querySelector("td[data-focused='true']");
    expect(focused).toHaveAttribute("data-row", "0");
  });

  it("末尾行で↓キーを押しても移動しない", async () => {
    const user = userEvent.setup();
    renderHistory();
    await waitFor(() => screen.getByText("2026-03-19 10:00"));
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    const focused = document.querySelector("td[data-focused='true']");
    expect(focused).toHaveAttribute("data-row", "2");
  });

  it("→キーで次の列に移動する", async () => {
    const user = userEvent.setup();
    renderHistory();
    await waitFor(() => screen.getByText("2026-03-19 10:00"));
    await user.keyboard("{ArrowRight}");
    const focused = document.querySelector("td[data-focused='true']");
    expect(focused).toHaveAttribute("data-col", "1");
  });

  it("←キーで前の列に移動する", async () => {
    const user = userEvent.setup();
    renderHistory();
    await waitFor(() => screen.getByText("2026-03-19 10:00"));
    await user.keyboard("{ArrowRight}");
    await user.keyboard("{ArrowLeft}");
    const focused = document.querySelector("td[data-focused='true']");
    expect(focused).toHaveAttribute("data-col", "0");
  });

  it("先頭列で←キーを押しても移動しない", async () => {
    const user = userEvent.setup();
    renderHistory();
    await waitFor(() => screen.getByText("2026-03-19 10:00"));
    await user.keyboard("{ArrowLeft}");
    const focused = document.querySelector("td[data-focused='true']");
    expect(focused).toHaveAttribute("data-col", "0");
  });

  it("末尾列で→キーを押しても移動しない", async () => {
    const user = userEvent.setup();
    renderHistory();
    await waitFor(() => screen.getByText("2026-03-19 10:00"));
    // 列は4列（0-3）
    for (let i = 0; i < 5; i++) await user.keyboard("{ArrowRight}");
    const focused = document.querySelector("td[data-focused='true']");
    expect(focused).toHaveAttribute("data-col", "3");
  });

  it("Enterキーでフォーカス行の詳細画面に遷移する", async () => {
    const user = userEvent.setup();
    renderHistory();
    await waitFor(() => screen.getByText("2026-03-19 10:00"));
    await user.keyboard("{Enter}");
    expect(mockNavigate).toHaveBeenCalledWith("/report/r1");
  });

  it("↓→Enterで2行目の詳細画面に遷移する", async () => {
    const user = userEvent.setup();
    renderHistory();
    await waitFor(() => screen.getByText("2026-03-19 10:00"));
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(mockNavigate).toHaveBeenCalledWith("/report/r2");
  });

  it("フォーカスセルにring-2 ring-inset ring-blue-500スタイルが適用される", async () => {
    renderHistory();
    await waitFor(() => screen.getByText("2026-03-19 10:00"));
    const focused = document.querySelector("td[data-focused='true']");
    expect(focused?.className).toContain("ring-2");
    expect(focused?.className).toContain("ring-inset");
    expect(focused?.className).toContain("ring-blue-500");
  });
});

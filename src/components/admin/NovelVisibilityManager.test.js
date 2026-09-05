// ============================================
// 檔案名稱: NovelVisibilityManager.test.js
// 路徑: src/components/admin/NovelVisibilityManager.test.js
// 用途: 驗證管理員小說顯示狀態操作流程
// ============================================

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NovelVisibilityManager from "./NovelVisibilityManager";
import {
  backfillNovelVisibility,
  getAllNovels,
  setNovelHiddenState,
} from "../../firebase/novels";
import { refreshNovels } from "../../utils/novelsHelper";

jest.mock("../../firebase/novels", () => ({
  backfillNovelVisibility: jest.fn(),
  getAllNovels: jest.fn(),
  setNovelHiddenState: jest.fn(),
}));

jest.mock("../../utils/novelsHelper", () => ({
  refreshNovels: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

describe("NovelVisibilityManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    backfillNovelVisibility.mockResolvedValue(0);
    getAllNovels.mockResolvedValue([
      { id: "novel-1", title: "測試小說", author: "測試作者", isHidden: false },
    ]);
    setNovelHiddenState.mockResolvedValue();
    refreshNovels.mockResolvedValue();
  });

  test("管理員確認後可將公開小說切換為隱藏", async () => {
    render(<NovelVisibilityManager userId="admin-uid" />);

    expect(await screen.findByText("測試小說")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "隱藏小說" }));

    expect(screen.getByRole("heading", { name: "隱藏小說" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "確認隱藏" }));

    await waitFor(() => {
      expect(setNovelHiddenState).toHaveBeenCalledWith("novel-1", true, "admin-uid");
    });
    expect(await screen.findByText("已隱藏")).toBeTruthy();
  });
});

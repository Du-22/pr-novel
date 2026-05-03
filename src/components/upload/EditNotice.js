// ============================================
// 檔案名稱: EditNotice.js
// 路徑: src/components/upload/EditNotice.js
// 用途: 編輯頁的功能限制說明(顯示在 EditUploadPage 頂端)
// ============================================

import React from "react";
import { Info } from "lucide-react";

export default function EditNotice() {
  return (
    <div className="p-4 rounded-xl border flex items-start gap-3
                    bg-info-light/40 border-info/20
                    dark:bg-info/10 dark:border-info/30">
      <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-info" />
      <div className="text-sm text-neutral-700 dark:text-neutral-300">
        <p className="font-medium mb-0.5 text-neutral-900 dark:text-neutral-100">
          目前只能編輯基本資料
        </p>
        <p>若要修改章節內容,請刪除整本後重新上傳(舊格式),或於下方新增/編輯章節(新格式)。</p>
      </div>
    </div>
  );
}
